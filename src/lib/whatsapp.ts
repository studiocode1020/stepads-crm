export type ResultadoEnvio = {
  sucesso: boolean;
  messageId?: string;
  erro?: string;
};

export const CUSTO_UNITARIO =
  parseFloat(process.env.WHATSAPP_CUSTO_UNITARIO ?? "0.35");

export const calcularCusto = (quantidade: number): number =>
  parseFloat((quantidade * CUSTO_UNITARIO).toFixed(2));

const isMockMode = () =>
  !process.env.WHATSAPP_TOKEN ||
  !process.env.WHATSAPP_PHONE_NUMBER_ID;

export const enviarMensagem = async (
  telefone: string,
  mensagem: string
): Promise<ResultadoEnvio> => {
  if (isMockMode()) {
    // Modo simulação: 90% de sucesso
    await new Promise((r) => setTimeout(r, 50));
    const sucesso = Math.random() > 0.1;
    return sucesso
      ? { sucesso: true, messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}` }
      : { sucesso: false, erro: "Simulação: falha aleatória" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_TOKEN!;
  const apiUrl =
    process.env.WHATSAPP_API_URL ??
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const numero = telefone.replace(/\D/g, "");

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensagem },
      }),
    });

    const json = await resp.json();

    if (!resp.ok) {
      return {
        sucesso: false,
        erro: json?.error?.message ?? `HTTP ${resp.status}`,
      };
    }

    return { sucesso: true, messageId: json?.messages?.[0]?.id };
  } catch (error) {
    return { sucesso: false, erro: String(error) };
  }
};
