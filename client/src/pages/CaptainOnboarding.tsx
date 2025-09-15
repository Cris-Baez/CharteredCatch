import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload, FileText, Shield, User, Award, AlertCircle } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

// Tipos para los documentos del onboarding
interface OnboardingDocument {
  type: string;
  name: string;
  description: string;
  required: boolean;
  icon: any;
  uploaded?: boolean;
  url?: string;
}

// Lista de documentos requeridos para el onboarding
const ONBOARDING_DOCUMENTS: OnboardingDocument[] = [
  {
    type: "licenseDocument",
    name: "Licencia de Capitán",
    description: "Licencia válida emitida por la autoridad marítima",
    required: true,
    icon: Award,
  },
  {
    type: "boatDocumentation", 
    name: "Documentación de la Embarcación",
    description: "Registro y documentos de propiedad del barco",
    required: true,
    icon: FileText,
  },
  {
    type: "insuranceDocument",
    name: "Seguro de Responsabilidad",
    description: "Póliza de seguro vigente para operaciones comerciales",
    required: true,
    icon: Shield,
  },
  {
    type: "identificationPhoto",
    name: "Foto de Identificación",
    description: "Cédula o pasaporte vigente (frente y reverso)",
    required: true,
    icon: User,
  },
  {
    type: "localPermit",
    name: "Permiso Local",
    description: "Permisos locales para operar en la zona",
    required: true,
    icon: FileText,
  },
  {
    type: "cprCertification",
    name: "Certificación CPR",
    description: "Certificado de primeros auxilios y CPR (opcional)",
    required: false,
    icon: Award,
  },
  {
    type: "drugTestingResults",
    name: "Examen de Drogas",
    description: "Resultados recientes de examen toxicológico (opcional)",
    required: false,
    icon: FileText,
  },
];

export default function CaptainOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener información del usuario actual
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Obtener información del capitán
  const { data: captain } = useQuery({
    queryKey: ["/api/captains", (currentUser as any)?.id],
    enabled: !!(currentUser as any)?.id,
  });

  // Mutación para subir documentos
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ documentType, documentURL }: { documentType: string; documentURL: string }) => {
      const response = await fetch(`/api/captain/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, documentURL }),
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data, variables) => {
      setUploadedDocs(prev => new Set([...Array.from(prev), variables.documentType]));
      toast({
        title: "✅ Documento subido",
        description: "El documento se ha guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/captains", (currentUser as any)?.id] });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Función para obtener URL de subida
  const getUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    if (!response.ok) throw new Error('Failed to get upload URL');
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  // Manejar completación de subida
  const handleUploadComplete = (documentType: string) => (result: UploadResult<any, any>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      uploadDocumentMutation.mutate({
        documentType,
        documentURL: uploadedFile.uploadURL!,
      });
    }
  };

  // Calcular progreso total
  const requiredDocs = ONBOARDING_DOCUMENTS.filter(doc => doc.required);
  const uploadedRequiredDocs = requiredDocs.filter(doc => uploadedDocs.has(doc.type));
  const progress = (uploadedRequiredDocs.length / requiredDocs.length) * 100;

  // Verificar si el onboarding está completo
  const isOnboardingComplete = uploadedRequiredDocs.length === requiredDocs.length;

  // Pasos del wizard
  const steps = [
    {
      title: "Bienvenido",
      description: "Información sobre el proceso",
    },
    {
      title: "Documentos",
      description: "Subir documentación requerida",
    },
    {
      title: "Verificación",
      description: "Revisión y activación",
    },
  ];

  useEffect(() => {
    // Marcar pasos completados basado en el progreso
    const newCompletedSteps = new Set<number>();
    if (currentStep > 0) newCompletedSteps.add(0);
    if (uploadedDocs.size > 0) newCompletedSteps.add(1);
    if (isOnboardingComplete) newCompletedSteps.add(2);
    setCompletedSteps(newCompletedSteps);
  }, [currentStep, uploadedDocs, isOnboardingComplete]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Onboarding de Capitán
          </h1>
          <p className="text-gray-600">
            Completa tu perfil para comenzar a ofrecer charters en Charterly
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    completedSteps.has(index)
                      ? "bg-blue-600 text-white"
                      : currentStep === index
                      ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {completedSteps.has(index) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      completedSteps.has(index) ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-medium text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Content based on current step */}
        {currentStep === 0 && (
          <Card data-testid="card-welcome-step">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">¡Bienvenido a Charterly!</CardTitle>
              <CardDescription>
                Para comenzar a ofrecer tus servicios como capitán, necesitamos verificar algunos documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">¿Qué necesitas preparar?</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Licencia de capitán válida
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Documentos de la embarcación
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Seguro de responsabilidad
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Identificación oficial
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Permisos locales
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Proceso de verificación</h3>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <p className="font-medium">Sube tus documentos</p>
                        <p className="text-sm">Formatos aceptados: JPG, PNG, PDF</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <p className="font-medium">Revisión por nuestro equipo</p>
                        <p className="text-sm">Verificamos en 1-2 días hábiles</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <p className="font-medium">Activación del perfil</p>
                        <p className="text-sm">Comienza a ofrecer tus charters</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => setCurrentStep(1)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-start-onboarding"
                >
                  Comenzar Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Progress indicator */}
            <Card data-testid="card-progress-indicator">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progreso del onboarding
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadedRequiredDocs.length} de {requiredDocs.length} documentos requeridos
                  </span>
                </div>
                <Progress value={progress} className="w-full" />
              </CardContent>
            </Card>

            {/* Documents grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {ONBOARDING_DOCUMENTS.map((doc) => {
                const isUploaded = uploadedDocs.has(doc.type);
                const IconComponent = doc.icon;
                
                return (
                  <Card key={doc.type} data-testid={`card-document-${doc.type}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isUploaded ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {isUploaded ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {doc.name}
                            {doc.required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {doc.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isUploaded ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Documento subido</span>
                        </div>
                      ) : (
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760} // 10MB
                          onGetUploadParameters={getUploadParameters}
                          onComplete={handleUploadComplete(doc.type)}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>Subir documento</span>
                          </div>
                        </ObjectUploader>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(0)}
                data-testid="button-back-to-welcome"
              >
                Atrás
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!isOnboardingComplete}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                data-testid="button-continue-to-verification"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <Card data-testid="card-verification-step">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">¡Documentación Completa!</CardTitle>
              <CardDescription>
                Hemos recibido todos tus documentos. Nuestro equipo los revisará pronto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Verificación en proceso</h3>
                <p className="text-gray-600 mb-4">
                  Revisaremos tus documentos en 1-2 días hábiles
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">¿Qué sigue?</p>
                      <ul className="text-blue-800 text-sm space-y-1 mt-2">
                        <li>• Te notificaremos por email cuando completemos la revisión</li>
                        <li>• Una vez aprobado, podrás activar tu prueba gratuita de 1 mes</li>
                        <li>• Comenzarás a recibir reservas inmediatamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button 
                  onClick={() => window.location.href = "/captain/dashboard"}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-go-to-dashboard"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}