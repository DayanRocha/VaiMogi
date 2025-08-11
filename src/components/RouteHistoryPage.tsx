import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Send, Calendar, Clock, MapPin, User, CheckCircle, Filter, X } from 'lucide-react';
import { routeHistoryService, RouteHistoryItem } from '../services/routeHistoryService';
import { Guardian } from '@/types/driver';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Interface importada do routeHistoryService

interface RouteHistoryPageProps {
  onBack: () => void;
}

export const RouteHistoryPage = ({ onBack }: RouteHistoryPageProps) => {
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);
  const [filteredRouteHistory, setFilteredRouteHistory] = useState<RouteHistoryItem[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteHistoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [guardianSearchTerm, setGuardianSearchTerm] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [filteredGuardians, setFilteredGuardians] = useState<any[]>([]);

  // Estados para filtro de data
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
  });
  const [filterType, setFilterType] = useState<'today' | 'date' | 'range'>('today');

  const { toast } = useToast();

  // Carregar histórico de rotas e responsáveis do localStorage
  useEffect(() => {
    loadRouteHistory();
    loadGuardians();
  }, []);

  // Aplicar filtros quando dados ou filtros mudarem
  useEffect(() => {
    applyDateFilter();
  }, [routeHistory, selectedDate, dateRange, filterType]);

  // Filtrar responsáveis baseado no termo de busca
  useEffect(() => {
    if (guardianSearchTerm.trim() === '') {
      setFilteredGuardians([]);
    } else {
      const filtered = guardians.filter(guardian =>
        guardian.name.toLowerCase().includes(guardianSearchTerm.toLowerCase())
      );
      setFilteredGuardians(filtered);
    }
  }, [guardianSearchTerm, guardians]);

  const loadRouteHistory = () => {
    try {
      // Carregar todo o histórico de rotas (não apenas hoje)
      const allRoutes = routeHistoryService.getRouteHistory();
      setRouteHistory(allRoutes);

      console.log(`📊 Histórico carregado: ${allRoutes.length} rotas encontradas no total`);

      if (allRoutes.length > 0) {
        console.log('✅ Rotas carregadas:', allRoutes.map(route => ({
          id: route.id,
          driverName: route.driverName,
          direction: route.direction,
          date: new Date(route.date).toLocaleDateString('pt-BR'),
          studentsCount: route.studentsCount,
          completedStudents: route.completedStudents,
          duration: route.duration
        })));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico de rotas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de rotas.",
        variant: "destructive"
      });
      setRouteHistory([]);
    }
  };

  const applyDateFilter = () => {
    let filtered: RouteHistoryItem[] = [];

    switch (filterType) {
      case 'today':
        filtered = routeHistoryService.getTodayRouteHistory();
        break;

      case 'date':
        if (selectedDate) {
          const targetDate = new Date(selectedDate);
          filtered = routeHistory.filter(route => {
            const routeDate = new Date(route.date);
            return routeDate.toDateString() === targetDate.toDateString();
          });
        } else {
          filtered = routeHistory;
        }
        break;

      case 'range':
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Incluir o dia final completo

          filtered = routeHistory.filter(route => {
            const routeDate = new Date(route.date);
            return routeDate >= startDate && routeDate <= endDate;
          });
        } else {
          filtered = routeHistory;
        }
        break;

      default:
        filtered = routeHistory;
    }

    setFilteredRouteHistory(filtered);

    console.log(`🔍 Filtro aplicado (${filterType}):`, {
      total: routeHistory.length,
      filtered: filtered.length,
      selectedDate,
      dateRange
    });
  };

  const clearFilters = () => {
    setFilterType('today');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setDateRange({ start: '', end: '' });
    setShowDateFilter(false);
  };

  const getFilterDescription = () => {
    switch (filterType) {
      case 'today':
        return `Rotas de hoje - ${new Date().toLocaleDateString('pt-BR')}`;
      case 'date':
        return selectedDate ? `Rotas de ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : 'Selecione uma data';
      case 'range':
        if (dateRange.start && dateRange.end) {
          return `Rotas de ${new Date(dateRange.start).toLocaleDateString('pt-BR')} até ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`;
        }
        return 'Selecione o período';
      default:
        return 'Todas as rotas';
    }
  };

  const loadGuardians = () => {
    try {
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        const parsedGuardians = JSON.parse(savedGuardians);
        setGuardians(parsedGuardians);
        console.log('📋 Responsáveis carregados:', parsedGuardians.length);
      } else {
        console.log('⚠️ Nenhum responsável encontrado no localStorage');
        setGuardians([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar responsáveis:', error);
      setGuardians([]);
    }
  };

  const handleDeleteRoute = (route: RouteHistoryItem) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRoute = () => {
    if (selectedRoute) {
      try {
        const success = routeHistoryService.removeRouteFromHistory(selectedRoute.id);

        if (success) {
          const updatedHistory = routeHistory.filter(route => route.id !== selectedRoute.id);
          setRouteHistory(updatedHistory);

          toast({
            title: "Rota excluída",
            description: "A rota foi removida do histórico com sucesso."
          });
        } else {
          throw new Error('Falha ao remover rota do histórico');
        }
      } catch (error) {
        console.error('Erro ao excluir rota:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a rota.",
          variant: "destructive"
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedRoute(null);
  };

  const handleSendRoute = (route: RouteHistoryItem) => {
    setSelectedRoute(route);
    setRecipientEmail('');
    setGuardianSearchTerm('');
    setSelectedGuardian(null);
    setFilteredGuardians([]);
    setMessage(`📋 *Relatório da Rota - ${route.direction === 'to_school' ? 'Ida' : 'Volta'}*\n\n📅 Data: ${new Date(route.date).toLocaleDateString('pt-BR')}\n👨‍✈️ Motorista: ${route.driverName}\n⏰ Horário: ${route.startTime} - ${route.endTime || 'Em andamento'}\n⏱️ Duração: ${route.duration || 'N/A'}\n👥 Estudantes: ${route.completedStudents}/${route.studentsCount} coletados\n\n${route.studentPickups ? route.studentPickups.map(student => `• ${student.studentName} - ${student.status === 'picked_up' ? '✅ Coletado' : student.status === 'dropped_off' ? '🏠 Entregue' : '⏳ Pendente'}`).join('\n') : ''}\n\n_Relatório gerado automaticamente pelo sistema VaiMogi_`);
    setIsSendDialogOpen(true);
  };

  const confirmSendRoute = () => {
    if (selectedRoute && selectedGuardian) {
      try {
        // Formatar número de telefone para WhatsApp (remover caracteres especiais)
        const phoneNumber = selectedGuardian.phone.replace(/\D/g, '');

        // Criar URL do WhatsApp com a mensagem
        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

        // Abrir WhatsApp em nova aba
        window.open(whatsappUrl, '_blank');

        toast({
          title: "WhatsApp aberto",
          description: `Relatório preparado para envio via WhatsApp para ${selectedGuardian.name}.`
        });

        console.log('📱 WhatsApp aberto para:', {
          guardian: selectedGuardian.name,
          phone: selectedGuardian.phone,
          route: selectedRoute.id
        });

      } catch (error) {
        console.error('❌ Erro ao abrir WhatsApp:', error);
        toast({
          title: "Erro",
          description: "Não foi possível abrir o WhatsApp. Verifique se o número está correto.",
          variant: "destructive"
        });
      }

      setIsSendDialogOpen(false);
      setSelectedRoute(null);
      setRecipientEmail('');
      setGuardianSearchTerm('');
      setSelectedGuardian(null);
      setFilteredGuardians([]);
      setMessage('');
    } else {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um responsável para enviar o relatório.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'to_school' ? 'Ida (Casa → Escola)' : 'Volta (Escola → Casa)';
  };

  const getStatusColor = (completed: number, total: number) => {
    if (completed === total) return 'text-green-600 bg-green-50';
    if (completed > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-orange-600 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Histórico de Rotas</h1>
            <p className="text-orange-100 text-sm">
              {getFilterDescription()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="text-white hover:bg-orange-600 p-2"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Filtro de Data */}
      {showDateFilter && (
        <div className="bg-white border-b shadow-sm p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Filtrar por Data</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateFilter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Opções de filtro */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('today')}
                className="text-xs"
              >
                Hoje
              </Button>
              <Button
                variant={filterType === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('date')}
                className="text-xs"
              >
                Data Específica
              </Button>
              <Button
                variant={filterType === 'range' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('range')}
                className="text-xs"
              >
                Período
              </Button>
            </div>

            {/* Seleção de data específica */}
            {filterType === 'date' && (
              <div className="space-y-2">
                <Label htmlFor="specific-date">Selecionar Data</Label>
                <Input
                  id="specific-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {/* Seleção de período */}
            {filterType === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
              <div className="flex-1"></div>
              <span className="text-sm text-gray-500">
                {filteredRouteHistory.length} rota(s) encontrada(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {filteredRouteHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {filterType === 'today' ? 'Nenhuma rota realizada hoje' : 'Nenhuma rota encontrada'}
            </h3>
            <p className="text-sm">
              {filterType === 'today'
                ? 'As rotas executadas aparecerão aqui'
                : 'Tente ajustar os filtros de data'
              }
            </p>
            {filterType !== 'today' && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Ver rotas de hoje
              </Button>
            )}
          </div>
        ) : (
          filteredRouteHistory.map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">
                      {getDirectionLabel(route.direction)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.completedStudents, route.studentsCount)
                      }`}>
                      {route.completedStudents === route.studentsCount ? 'Concluída' : 'Parcial'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{route.driverName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(route.startTime)} - {route.endTime || 'Em andamento'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>{route.completedStudents}/{route.studentsCount} estudantes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(route.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Clock className="w-4 h-4" />
                      <span>Duração: {route.duration || 'Calculando...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendRoute(route)}
                  className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Relatório
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRoute(route)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir esta rota do histórico? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRoute}
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para enviar relatório */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Relatório via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="guardian-search">Buscar Responsável</Label>
              <Input
                id="guardian-search"
                type="text"
                placeholder="Digite o nome do responsável..."
                value={guardianSearchTerm}
                onChange={(e) => setGuardianSearchTerm(e.target.value)}
              />

              {/* Lista de responsáveis filtrados */}
              {filteredGuardians.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                  {filteredGuardians.map((guardian) => (
                    <div
                      key={guardian.id}
                      className={`p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${selectedGuardian?.id === guardian.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      onClick={() => {
                        setSelectedGuardian(guardian);
                        setGuardianSearchTerm(guardian.name);
                        setFilteredGuardians([]);
                      }}
                    >
                      <div className="font-medium">{guardian.name}</div>
                      <div className="text-sm text-gray-500">{guardian.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Responsável selecionado */}
              {selectedGuardian && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-800">{selectedGuardian.name}</div>
                      <div className="text-sm text-green-600">{selectedGuardian.phone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Mensagem será enviada via WhatsApp..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsSendDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmSendRoute}
                disabled={!selectedGuardian}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};