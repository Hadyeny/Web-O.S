import React, { useState } from 'react';
import {
  Mail,
  Lock,
  AlertCircle,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { API_ROUTES } from '../constants/apiRoutes';

export interface AuthResponseUser {
  id: string;
  name: string;
  email: string;
  role: 'TECNICO' | 'ADMIN' | 'SUPER_ADMIN' | string;
  avatar?: string;
}

interface LoginProps {
  onLoginSuccess?: (user: AuthResponseUser, token: string, redirectPath: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(API_ROUTES.login, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data?.error || 'Credenciais inválidas. Verifique seu e-mail e senha corporativos.'
        );
        setLoading(false);
        return;
      }

      const { user } = data;

      // Salva os dados do perfil do usuário para exibição local no frontend
      localStorage.setItem('@Pliioou:user', JSON.stringify(user));
      localStorage.removeItem('@Pliioou:logged_out');

      // Determina o redirecionamento com base nas regras corporativas:
      // - SUPER_ADMIN -> '/admin/manutencao'
      // - ADMIN ou TECNICO -> '/dashboard-tecnico'
      const normalizedRole = (user?.role || '').toUpperCase();
      let targetPath = '/dashboard-tecnico';

      if (normalizedRole === 'SUPER_ADMIN') {
        targetPath = '/admin/manutencao';
      } else {
        targetPath = '/dashboard-tecnico';
      }

      setSuccessMessage(
        `Autenticado com sucesso como ${user.name} (${normalizedRole})! Redirecionando...`
      );

      // Dispara callback de autenticação ou navegação do navegador
      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess(user, undefined, targetPath);
        }, 500);
      } else {
        setTimeout(() => {
          window.location.pathname = targetPath;
        }, 600);
      }
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setErrorMessage(
        'Não foi possível conectar ao servidor de autenticação. Verifique sua conexão de rede.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-100">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          {/* Cabeçalho e Identidade Visual */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Plioou
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                Gestão Corporativa de TI & Ordens de Serviço
              </p>
            </div>
          </div>

          {/* Banner de Erro */}
          {errorMessage && (
            <div
              id="login-error-alert"
              role="alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs font-medium animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Banner de Sucesso */}
          {successMessage && (
            <div
              id="login-success-alert"
              role="status"
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs font-medium animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Formulário Limpo de Login (Sem blocos de credenciais fictícias) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                E-mail Corporativo
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@plioou.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Senha de Acesso
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Botão de Envio Limpo */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé de Segurança */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autenticação Corporativa TI &bull; Token JWT 8h</span>
          </div>

        </div>
      </div>
    </div>
  );
};
