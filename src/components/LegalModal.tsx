import React from 'react';
import { X, Shield } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#121212] border border-[#2E2E2E] rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#71717A] hover:text-white rounded-full bg-[#181818] border border-[#262626] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-[#F59E0B] uppercase mb-2">
          <Shield className="w-4 h-4" />
          <span>Documento Oficial</span>
        </div>

        <h3 className="text-2xl font-black text-white">
          {isPrivacy ? 'Política de Privacidade' : 'Termos de Uso'}
        </h3>
        <p className="text-xs text-[#71717A] mb-4">
          Última atualização: Novembro de 2026
        </p>

        <div className="overflow-y-auto space-y-4 pr-2 text-xs text-[#A1A1AA] leading-relaxed border-t border-[#222222] pt-4">
          {isPrivacy ? (
            <>
              <h4 className="text-sm font-bold text-white">1. Privacidade em Primeiro Lugar</h4>
              <p>
                O UMBRA Daily OS foi desenhado segundo os princípios de "Privacy by Design". Suas anotações, tarefas, ideias do cofre e métricas de foco são tratadas com criptografia de ponta a ponta.
              </p>

              <h4 className="text-sm font-bold text-white">2. Coleta Mínima de Dados</h4>
              <p>
                Coletamos estritamente o necessário para operacionalizar seu plano: nome, endereço de e-mail e informações para emissão de faturamento da assinatura mensal (R$ 9,90). Não vendemos seus dados para terceiros sob nenhuma circunstância.
              </p>

              <h4 className="text-sm font-bold text-white">3. Segurança dos Dados</h4>
              <p>
                Utilizamos infraestrutura em nuvem segura com backups contínuos e comunicação via protocolo HTTPS/TLS criptografado.
              </p>

              <h4 className="text-sm font-bold text-white">4. Seus Direitos (LGPD)</h4>
              <p>
                Você tem o direito de solicitar a exportação ou exclusão definitiva de todo o seu histórico a qualquer momento diretamente pelo suporte.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-white">1. Objeto e Aceitação</h4>
              <p>
                Ao assinar o UMBRA Daily OS, você adquire uma licença pessoal de uso do sistema de produtividade e execução diária.
              </p>

              <h4 className="text-sm font-bold text-white">2. Assinatura e Pagamentos</h4>
              <p>
                O plano é contratado no modelo mensal pelo valor de R$ 9,90 (nove reais e noventa centavos). Não existem taxas ocultas ou compromisso de permanência mínima.
              </p>

              <h4 className="text-sm font-bold text-white">3. Cancelamento Descomplicado</h4>
              <p>
                O assinante pode cancelar a renovação da assinatura a qualquer momento com apenas 1 clique ou via solicitação ao suporte. O acesso permanecerá ativo até o fim do ciclo mensal vigente.
              </p>

              <h4 className="text-sm font-bold text-white">4. Disponibilidade do Serviço</h4>
              <p>
                Garantimos disponibilidade de serviço visando uptime de 99.9%, com manutenções preventivas programadas comunicadas previamente.
              </p>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-[#222222] mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F59E0B] text-black font-bold text-xs hover:bg-[#FBBF24] transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
