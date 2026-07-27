
export interface RoomBasicFormValues {
  title: string;
  maxParticipants: string;
}

export function validateRoomBasicFields(values: RoomBasicFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = 'Oda başlığı zorunludur.';
  }

  const amount = Number(values.maxParticipants);
  if (!values.maxParticipants.trim() || Number.isNaN(amount)) {
    errors.maxParticipants = 'Geçerli bir sayı giriniz.';
  } else if (amount < 2 || amount > 50) {
    errors.maxParticipants = 'Katılımcı sayısı 2 ile 50 arasında olmalıdır.';
  }

  return errors;
}
