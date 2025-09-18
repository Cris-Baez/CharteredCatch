import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { fetchWithCsrf } from "@/lib/csrf";

interface ReviewFormProps {
  charterId: number;
  charterTitle: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ charterId, charterTitle, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { charterId: number; rating: number; comment: string; captainId?: number }) => {
      console.log("Submitting review data:", reviewData); // Debug log
      
      // Get charter details to find captainId if not provided
      let captainId = reviewData.captainId;
      if (!captainId) {
        const charterResponse = await fetch(`/api/charters/${reviewData.charterId}`, {
          credentials: "include",
        });
        if (charterResponse.ok) {
          const charter = await charterResponse.json();
          captainId = charter.captainId;
        }
      }
      
      const response = await fetchWithCsrf("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          charterId: Number(reviewData.charterId),
          captainId: Number(captainId),
          rating: Number(reviewData.rating),
          comment: String(reviewData.comment).trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Review submission error:", errorData); // Debug log
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review has been published.",
      });
      
      // Reset form
      setRating(0);
      setComment("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["reviews", charterId] });
      queryClient.invalidateQueries({ queryKey: ["charter", String(charterId)] });
      queryClient.invalidateQueries({ queryKey: ["charters"] });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Submit review error:", error);
      const errorMessage = error?.message || "Failed to submit review";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating from 1 to 5 stars",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Comment Too Short",
        description: "Please write at least 10 characters in your review",
        variant: "destructive",
      });
      return;
    }

    // Validate data before submitting
    const reviewData = {
      charterId: Number(charterId),
      rating: Number(rating),
      comment: comment.trim(),
    };

    console.log("Preparing to submit review:", reviewData); // Debug log

    submitReviewMutation.mutate(reviewData);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-storm-gray hover:text-gray-700"
              onClick={() => setShowLoginPrompt(!showLoginPrompt)}
            >
              <span className="text-sm">Write a review</span>
              <svg
                className={`ml-2 h-4 w-4 transition-transform ${
                  showLoginPrompt ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            {showLoginPrompt && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <p className="text-storm-gray mb-3">Please log in to write a review</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/login"}>
                  Log In
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <p className="text-sm text-storm-gray">Share your experience with {charterTitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  data-testid={`rating-star-${star}`}
                >
                  <Star
                    size={24}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-storm-gray self-center">
                  {rating} of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this charter. What did you like? What could be improved? (minimum 10 characters)"
              rows={4}
              maxLength={500}
              data-testid="review-comment"
            />
            <div className="text-right text-xs text-storm-gray mt-1">
              {comment.length}/500 characters
              {comment.length < 10 && comment.length > 0 && (
                <span className="text-red-500 ml-2">
                  Need {10 - comment.length} more characters
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={rating === 0 || comment.trim().length < 10 || submitReviewMutation.isPending}
              data-testid="submit-review"
            >
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}