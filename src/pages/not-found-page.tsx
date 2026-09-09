import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <h2 className="text-text text-lg font-semibold">Página não encontrada</h2>
      <p className="text-text-muted mt-2 text-[0.95rem]">
        O endereço acessado não existe ou foi removido.
      </p>
      <Link to="/" className="text-accent hover:text-accent-hover mt-4 inline-block underline">
        Voltar para o início
      </Link>
    </div>
  )
}
