export type UniverseStackParamList = {
  Universes: undefined;
  
  Subjects: { 
    universeId: string; 
    universeName: string; 
  };
  Topics:{
    subjectId: string;
    subjectName: string;
  };
  TopicDetail: {
    topicId: string;
    topicName: string;
  };
};