export enum AchievementCategory {
  TOTAL_QUESTIONS = 'TOTAL_QUESTIONS',
  TOTAL_CORRECT = 'TOTAL_CORRECT',
  ERRORLESS_SESSIONS = 'ERRORLESS_SESSIONS',
  STUDY_TIME = 'STUDY_TIME',
  STREAK = 'STREAK',
  SOCIAL_STUDY_TIME = 'SOCIAL_STUDY_TIME',
  FRIEND_COUNT = 'FRIEND_COUNT',
  ROOM_CREATION_COUNT = 'ROOM_CREATION_COUNT',
  SUBJECT_DIVERSITY = 'SUBJECT_DIVERSITY',
}

const HOURS = 3600;

export interface AchievementDefinition {
  key: string;
  category: AchievementCategory;
  threshold: number;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [

  { key: 'TOTAL_QUESTIONS_100', category: AchievementCategory.TOTAL_QUESTIONS, threshold: 100, title: 'İlk Adım', description: 'Toplam 100 soru çözdün.', icon: '🌱' },
  { key: 'TOTAL_QUESTIONS_500', category: AchievementCategory.TOTAL_QUESTIONS, threshold: 500, title: 'Azimli', description: 'Toplam 500 soru çözdün.', icon: '📘' },
  { key: 'TOTAL_QUESTIONS_1000', category: AchievementCategory.TOTAL_QUESTIONS, threshold: 1000, title: 'Bin Soru', description: 'Toplam 1000 soru çözdün.', icon: '📚' },
  { key: 'TOTAL_QUESTIONS_2000', category: AchievementCategory.TOTAL_QUESTIONS, threshold: 2000, title: 'Yorulmak Bilmez', description: 'Toplam 2000 soru çözdün.', icon: '🔥' },
  { key: 'TOTAL_QUESTIONS_5000', category: AchievementCategory.TOTAL_QUESTIONS, threshold: 5000, title: 'Efsane', description: 'Toplam 5000 soru çözdün.', icon: '🏆' },

  { key: 'TOTAL_CORRECT_250', category: AchievementCategory.TOTAL_CORRECT, threshold: 250, title: 'Keskin Nişancı', description: '250 doğru soru yaptın.', icon: '🎯' },
  { key: 'TOTAL_CORRECT_500', category: AchievementCategory.TOTAL_CORRECT, threshold: 500, title: 'Uzman Adayı', description: '500 doğru soru yaptın.', icon: '⭐' },
  { key: 'TOTAL_CORRECT_1000', category: AchievementCategory.TOTAL_CORRECT, threshold: 1000, title: 'Usta', description: '1000 doğru soru yaptın.', icon: '🌟' },
  { key: 'TOTAL_CORRECT_2500', category: AchievementCategory.TOTAL_CORRECT, threshold: 2500, title: 'Büyük Usta', description: '2500 doğru soru yaptın.', icon: '👑' },

  { key: 'ERRORLESS_SESSIONS_5', category: AchievementCategory.ERRORLESS_SESSIONS, threshold: 5, title: 'Hatasız Başlangıç', description: '5 hatasız seans tamamladın.', icon: '✅' },
  { key: 'ERRORLESS_SESSIONS_25', category: AchievementCategory.ERRORLESS_SESSIONS, threshold: 25, title: 'Kusursuz', description: '25 hatasız seans tamamladın.', icon: '💎' },
  { key: 'ERRORLESS_SESSIONS_100', category: AchievementCategory.ERRORLESS_SESSIONS, threshold: 100, title: 'Mükemmeliyetçi', description: '100 hatasız seans tamamladın.', icon: '🏅' },


  { key: 'STUDY_TIME_5H', category: AchievementCategory.STUDY_TIME, threshold: 5 * HOURS, title: 'İlk Kıvılcım', description: 'Toplam 5 saat çalıştın.', icon: '⏱️' },
  { key: 'STUDY_TIME_20H', category: AchievementCategory.STUDY_TIME, threshold: 20 * HOURS, title: 'Disiplinli', description: 'Toplam 20 saat çalıştın.', icon: '📅' },
  { key: 'STUDY_TIME_50H', category: AchievementCategory.STUDY_TIME, threshold: 50 * HOURS, title: 'Zaman Ustası', description: 'Toplam 50 saat çalıştın.', icon: '⏳' },
  { key: 'STUDY_TIME_100H', category: AchievementCategory.STUDY_TIME, threshold: 100 * HOURS, title: 'Yüz Saat Kulübü', description: 'Toplam 100 saat çalıştın.', icon: '🕰️' },
  { key: 'STUDY_TIME_250H', category: AchievementCategory.STUDY_TIME, threshold: 250 * HOURS, title: 'Sınırsız Emek', description: 'Toplam 250 saat çalıştın.', icon: '🌌' },

  { key: 'STREAK_3', category: AchievementCategory.STREAK, threshold: 3, title: 'Alev Aldı', description: '3 gün üst üste çalıştın.', icon: '🔥' },
  { key: 'STREAK_7', category: AchievementCategory.STREAK, threshold: 7, title: 'Haftalık Seri', description: '7 gün üst üste çalıştın.', icon: '🗓️' },
  { key: 'STREAK_14', category: AchievementCategory.STREAK, threshold: 14, title: 'İki Haftalık İstikrar', description: '14 gün üst üste çalıştın.', icon: '⚡' },
  { key: 'STREAK_30', category: AchievementCategory.STREAK, threshold: 30, title: 'Aylık Şampiyon', description: '30 gün üst üste çalıştın.', icon: '🚀' },
  { key: 'STREAK_100', category: AchievementCategory.STREAK, threshold: 100, title: 'Yüz Günlük Efsane', description: '100 gün üst üste çalıştın.', icon: '💫' },

  { key: 'SOCIAL_STUDY_TIME_3H', category: AchievementCategory.SOCIAL_STUDY_TIME, threshold: 3 * HOURS, title: 'İlk Buluşma', description: 'Bir çalışma odasında toplam 3 saat çalıştın.', icon: '🤝' },
  { key: 'SOCIAL_STUDY_TIME_10H', category: AchievementCategory.SOCIAL_STUDY_TIME, threshold: 10 * HOURS, title: 'Takım Ruhu', description: 'Bir çalışma odasında toplam 10 saat çalıştın.', icon: '👥' },
  { key: 'SOCIAL_STUDY_TIME_25H', category: AchievementCategory.SOCIAL_STUDY_TIME, threshold: 25 * HOURS, title: 'Oda Sakini', description: 'Bir çalışma odasında toplam 25 saat çalıştın.', icon: '🏠' },
  { key: 'SOCIAL_STUDY_TIME_50H', category: AchievementCategory.SOCIAL_STUDY_TIME, threshold: 50 * HOURS, title: 'Topluluk Yıldızı', description: 'Bir çalışma odasında toplam 50 saat çalıştın.', icon: '✨' },


  { key: 'FRIEND_COUNT_1', category: AchievementCategory.FRIEND_COUNT, threshold: 1, title: 'İlk Arkadaş', description: 'İlk arkadaşını ekledin.', icon: '🧑‍🤝‍🧑' },
  { key: 'FRIEND_COUNT_5', category: AchievementCategory.FRIEND_COUNT, threshold: 5, title: 'Sosyal Çevre', description: '5 arkadaşa ulaştın.', icon: '🎉' },
  { key: 'FRIEND_COUNT_10', category: AchievementCategory.FRIEND_COUNT, threshold: 10, title: 'Geniş Çevre', description: '10 arkadaşa ulaştın.', icon: '🌐' },
  { key: 'FRIEND_COUNT_25', category: AchievementCategory.FRIEND_COUNT, threshold: 25, title: 'Popüler', description: '25 arkadaşa ulaştın.', icon: '🎊' },


  { key: 'ROOM_CREATION_COUNT_1', category: AchievementCategory.ROOM_CREATION_COUNT, threshold: 1, title: 'İlk Ev Sahibi', description: 'İlk çalışma odanı kurdun.', icon: '🏗️' },
  { key: 'ROOM_CREATION_COUNT_5', category: AchievementCategory.ROOM_CREATION_COUNT, threshold: 5, title: 'Deneyimli Ev Sahibi', description: '5 çalışma odası kurdun.', icon: '🔑' },
  { key: 'ROOM_CREATION_COUNT_15', category: AchievementCategory.ROOM_CREATION_COUNT, threshold: 15, title: 'Topluluk Kurucusu', description: '15 çalışma odası kurdun.', icon: '🏛️' },
  { key: 'ROOM_CREATION_COUNT_30', category: AchievementCategory.ROOM_CREATION_COUNT, threshold: 30, title: 'Oda Ustası', description: '30 çalışma odası kurdun.', icon: '🏰' },


  { key: 'SUBJECT_DIVERSITY_2', category: AchievementCategory.SUBJECT_DIVERSITY, threshold: 2, title: 'Çok Yönlü', description: '2 farklı derste çalıştın.', icon: '🎨' },
  { key: 'SUBJECT_DIVERSITY_4', category: AchievementCategory.SUBJECT_DIVERSITY, threshold: 4, title: 'Her Şeyi Deniyorum', description: '4 farklı derste çalıştın.', icon: '🧭' },
  { key: 'SUBJECT_DIVERSITY_6', category: AchievementCategory.SUBJECT_DIVERSITY, threshold: 6, title: 'Rönesans İnsanı', description: '6 farklı derste çalıştın.', icon: '🌈' },
];

export const ERRORLESS_SESSION_MIN_QUESTIONS = 25;
export const ERRORLESS_SESSION_MIN_SECONDS_PER_QUESTION = 5;
