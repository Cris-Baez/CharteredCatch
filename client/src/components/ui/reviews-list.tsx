import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";

interface Review {
  id: number;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
}

interface ReviewsListProps {
  charterId: number;
}

export default function ReviewsList({ charterId }: ReviewsListProps) {
  const { data: reviews, isLoading, isError, error } = useQuery<Review[]>({
    queryKey: ["/api/reviews", charterId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${charterId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} ${response.statusText} — ${text}`);
      }
      return response.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-16 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load reviews</p>
          <p className="text-sm text-storm-gray mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDisplayName = (user: Review["user"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return "Anonymous User";
  };

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Star className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-storm-gray mb-2">No reviews yet</p>
          <p className="text-sm text-storm-gray">
            Be the first to share your experience with this charter!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <Card data-testid="reviews-section">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reviews ({reviews.length})</span>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-sm text-storm-gray">
              {averageRating.toFixed(1)} average
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
              {/* Review Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-ocean-blue/10 flex items-center justify-center overflow-hidden">
                    {review.user.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={getDisplayName(review.user)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-ocean-blue" />
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <p className="font-semibold text-sm">{getDisplayName(review.user)}</p>
                    <p className="text-xs text-storm-gray">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <Badge variant="secondary" className="text-xs">
                    {review.rating}/5
                  </Badge>
                </div>
              </div>
              
              {/* Review Content */}
              <div className="ml-13">
                <p className="text-sm leading-relaxed">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}