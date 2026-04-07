import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatarData = (data: Date | string | null | undefined): string => {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
};

export const formatarDataHora = (data: Date | string | null | undefined): string => {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
};

export const calcularIdade = (dataNascimento: Date | string | null | undefined): number | null => {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
};

export const ehAniversarianteDoMes = (data: Date | string | null | undefined): boolean => {
  if (!data) return false;
  const hoje = new Date();
  const nasc = new Date(data);
  return nasc.getMonth() === hoje.getMonth();
};
