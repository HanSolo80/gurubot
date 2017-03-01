export interface Question {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

export interface QuestionSimple {
    question: string;
    answer: string;
}

export interface Member {
    color: string;
    deleted: boolean;
    id: string;
    is_admin: boolean;
    is_bot: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    name: string;
    profile: Object;
    real_name: string;
    status: string;
    team_id: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
}

export interface Channel {
    created:number;
    creator:string;
    id:string;
    is_archived:boolean;
    is_channel:boolean;
    is_general:boolean;
    is_member:boolean;
    members:String[];
    name:string;
    num_members:number
    previous_names:String[];
    purpose:Object;
    topic:Object;
}

export interface Answer {
    name: string;
    answer: string;
}