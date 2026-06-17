import Link from 'next/link';

export default async function AssinaturaSucessoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const id = params.id?.slice(0, 8).toUpperCase() ?? '';

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-fresh-700">Assinatura ativa!</h1>
      {id && <p className="mt-2 text-stone-500">Código #{id}</p>}
      <p className="mt-4 text-stone-600">
        Toda semana geramos seu pedido na janela escolhida. Você paga via Pix quando receber a notificação.
      </p>
      <Link href="/cardapio" className="mt-8 inline-block rounded-full bg-fresh-600 px-8 py-3 font-semibold text-white">
        Ver cardápio
      </Link>
    </main>
  );
}
