import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Users,
  DollarSign,
  MessageCircle,
  Calendar,
  BarChart3,
  Shield,
  Search,
  Map,
  Star,
  Settings,
  Database,
  Code,
  Smartphone,
  Globe,
  CreditCard,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";

export default function AppOverview() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Charterly
          </h1>
          <p className="text-xl md:text-2xl mb-4">
            Plataforma Completa de Reservas de Charters de Pesca
          </p>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">
            Una aplicación web moderna que conecta pescadores con capitanes profesionales en los Cayos de Florida
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Resumen General</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Charterly</strong> es una plataforma web completa para la reserva de charters de pesca 
                  en los Cayos de Florida. Conecta pescadores con capitanes verificados, ofreciendo una 
                  experiencia de reserva sin comisiones tradicionales.
                </p>
                <p>
                  La aplicación está construida con tecnologías modernas y ofrece funcionalidades completas 
                  para tres tipos de usuarios: público general, usuarios registrados, capitanes y administradores.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Estadísticas Actuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">37</div>
                      <div className="text-sm text-gray-600">Páginas Totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-sm text-gray-600">Tipos de Usuario</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">$49</div>
                      <div className="text-sm text-gray-600">Suscripción/Mes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">0%</div>
                      <div className="text-sm text-gray-600">Comisiones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Stack Tecnológico</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>React 18</strong> - Framework principal</li>
                  <li><strong>TypeScript</strong> - Tipado estático</li>
                  <li><strong>Vite</strong> - Build tool y dev server</li>
                  <li><strong>Wouter</strong> - Routing ligero</li>
                  <li><strong>TanStack Query</strong> - State management</li>
                  <li><strong>React Hook Form</strong> - Manejo de formularios</li>
                  <li><strong>Zod</strong> - Validación de datos</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Node.js</strong> - Runtime</li>
                  <li><strong>Express.js</strong> - Framework web</li>
                  <li><strong>TypeScript</strong> - Lenguaje</li>
                  <li><strong>PostgreSQL</strong> - Base de datos</li>
                  <li><strong>Drizzle ORM</strong> - Object-Relational Mapping</li>
                  <li><strong>bcrypt</strong> - Hash de contraseñas</li>
                  <li><strong>Express Sessions</strong> - Manejo de sesiones</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  UI/UX & APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Radix UI</strong> - Componentes primitivos</li>
                  <li><strong>shadcn/ui</strong> - Sistema de diseño</li>
                  <li><strong>Tailwind CSS</strong> - Estilos</li>
                  <li><strong>Lucide React</strong> - Iconos</li>
                  <li><strong>Mapbox GL</strong> - Mapas interactivos</li>
                  <li><strong>Stripe</strong> - Procesamiento de pagos</li>
                  <li><strong>Replit Auth</strong> - Autenticación</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types & Pages */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tipos de Usuario y Funcionalidades</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Public Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Usuarios Públicos (14 páginas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Página principal</strong> - Descubrimiento de charters</li>
                  <li>• <strong>Búsqueda y filtros</strong> - Buscar charters por ubicación/especie</li>
                  <li>• <strong>Detalles de charter</strong> - Información completa y reservas</li>
                  <li>• <strong>Asistente IA</strong> - Recomendaciones personalizadas</li>
                  <li>• <strong>Directorio de capitanes</strong> - Perfiles y verificaciones</li>
                  <li>• <strong>Información legal</strong> - Términos, privacidad, políticas</li>
                  <li>• <strong>Soporte y ayuda</strong> - Centro de ayuda y contacto</li>
                  <li>• <strong>Seguridad</strong> - Estándares y pautas de seguridad</li>
                  <li>• <strong>Login/Registro</strong> - Autenticación de usuarios</li>
                </ul>
              </CardContent>
            </Card>

            {/* Registered Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuarios Registrados (7 páginas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Dashboard personalizado</strong> - Recomendaciones y búsqueda</li>
                  <li>• <strong>Mis viajes</strong> - Gestión de reservas activas y pasadas</li>
                  <li>• <strong>Mensajería</strong> - Chat directo con capitanes</li>
                  <li>• <strong>Perfil de usuario</strong> - Configuración de cuenta</li>
                  <li>• <strong>Búsqueda avanzada</strong> - Filtros y mapas para usuarios</li>
                  <li>• <strong>Detalles de charter</strong> - Vista de usuario con reservas</li>
                  <li>• <strong>Centro de ayuda</strong> - Soporte personalizado</li>
                </ul>
              </CardContent>
            </Card>

            {/* Captains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Capitanes (15 páginas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Dashboard principal</strong> - Resumen de actividad</li>
                  <li>• <strong>Gestión de charters</strong> - Crear, editar, listar charters</li>
                  <li>• <strong>Reservas</strong> - Administrar bookings y confirmaciones</li>
                  <li>• <strong>Calendario</strong> - Disponibilidad y programación</li>
                  <li>• <strong>Mensajería</strong> - Comunicación con clientes</li>
                  <li>• <strong>Ganancias</strong> - Tracking de ingresos y reportes</li>
                  <li>• <strong>Analytics</strong> - Métricas de desempeño</li>
                  <li>• <strong>Perfil profesional</strong> - Configuración de cuenta</li>
                  <li>• <strong>Pagos</strong> - Configuración de métodos de pago</li>
                  <li>• <strong>Suscripción</strong> - Gestión de plan mensual</li>
                </ul>
              </CardContent>
            </Card>

            {/* Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Administradores (1 página)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Panel administrativo</strong> - Control total de la plataforma</li>
                  <li>• Gestión de usuarios y capitanes</li>
                  <li>• Moderación de contenido</li>
                  <li>• Verificación de capitanes</li>
                  <li>• Reportes y analytics globales</li>
                  <li>• Configuración del sistema</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-16 px-6 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Modelo de Negocio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Suscripción de Capitanes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">$49</div>
                  <div className="text-gray-600">por mes</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Listados ilimitados de charters</li>
                  <li>✓ Mensajería directa con clientes</li>
                  <li>✓ Gestión avanzada de reservas</li>
                  <li>✓ Analytics y reportes</li>
                  <li>✓ Soporte prioritario</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Sin Comisiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">0%</div>
                  <div className="text-gray-600">comisión</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Capitanes mantienen 100% de ganancias</li>
                  <li>✓ Pagos directos entre usuarios y capitanes</li>
                  <li>✓ Múltiples métodos de pago</li>
                  <li>✓ Sin fees ocultos</li>
                  <li>✓ Transparencia total en precios</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuarios Gratuitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-purple-600">Gratis</div>
                  <div className="text-gray-600">siempre</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Búsqueda ilimitada de charters</li>
                  <li>✓ Reservas sin restricciones</li>
                  <li>✓ Mensajería con capitanes</li>
                  <li>✓ Gestión de viajes</li>
                  <li>✓ Reseñas y ratings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades Principales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Búsqueda Avanzada</h3>
                <p className="text-sm text-gray-600">
                  Filtros por ubicación, especies objetivo, duración y fechas disponibles
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Map className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Mapas Interactivos</h3>
                <p className="text-sm text-gray-600">
                  Visualización de charters en mapas con Mapbox GL para fácil navegación
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <MessageCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Mensajería Directa</h3>
                <p className="text-sm text-gray-600">
                  Chat en tiempo real entre usuarios y capitanes para coordinación
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Gestión de Reservas</h3>
                <p className="text-sm text-gray-600">
                  Sistema completo de bookings con confirmaciones y cancelaciones
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Sistema de Reseñas</h3>
                <p className="text-sm text-gray-600">
                  Calificaciones y comentarios para mantener calidad del servicio
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Verificación de Capitanes</h3>
                <p className="text-sm text-gray-600">
                  Proceso de verificación para garantizar profesionalismo y seguridad
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Analytics Avanzados</h3>
                <p className="text-sm text-gray-600">
                  Métricas de desempeño y reportes para capitanes y administradores
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <CreditCard className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Múltiples Pagos</h3>
                <p className="text-sm text-gray-600">
                  Soporte para bank transfer, PayPal, Venmo, Zelle y Cash App
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Database Schema */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Estructura de Base de Datos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tablas Principales</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>users</strong> - Información de usuarios</li>
                  <li><strong>captains</strong> - Perfiles de capitanes</li>
                  <li><strong>charters</strong> - Listados de charters</li>
                  <li><strong>bookings</strong> - Reservas de usuarios</li>
                  <li><strong>messages</strong> - Sistema de mensajería</li>
                  <li><strong>reviews</strong> - Reseñas y calificaciones</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tablas de Soporte</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>sessions</strong> - Manejo de sesiones</li>
                  <li><strong>availability</strong> - Disponibilidad de charters</li>
                  <li><strong>captainPaymentInfo</strong> - Info de pagos</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Características Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>PostgreSQL</strong> como base de datos</li>
                  <li>• <strong>Drizzle ORM</strong> para consultas</li>
                  <li>• <strong>Migraciones automáticas</strong></li>
                  <li>• <strong>Índices optimizados</strong></li>
                  <li>• <strong>Validación con Zod</strong></li>
                  <li>• <strong>TypeScript types</strong> automáticos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Demo */}
      <section className="py-16 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Información de Contacto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Mail className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Email</h3>
              <p>contacto@charterly.com</p>
            </div>
            
            <div>
              <Phone className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Teléfono</h3>
              <p>+1 (555) 123-4567</p>
            </div>
            
            <div>
              <Globe className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Website</h3>
              <p>www.charterly.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg">
              ¿Interesado en conocer más sobre Charterly?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Solicitar Demo
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Ver Documentación Técnica
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}