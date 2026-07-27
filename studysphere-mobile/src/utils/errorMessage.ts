import axios from 'axios';


export const getErrorMessage = (
  error: unknown,
  fallback: string = 'İşlem sırasında bir hata oluştu.',
): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === 'string') {
      return serverMessage;
    }
    if (Array.isArray(serverMessage)) {
      return serverMessage.join(' ');
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
