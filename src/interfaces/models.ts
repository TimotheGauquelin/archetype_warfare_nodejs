export interface ICardTypeModel {
    id: number;
    label: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export interface IArchetypeModel {
    id: number;
    label: string;
    description: string;
    era_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface IEraModel {
    id: number;
    label: string;
}

export interface IAttributeModel {
    id: number;
    label: string;
}

export interface ISummonMechanicModel {
    id: number;
    label: string;
}

export interface IUserModel {
    id: number;
    username: string;
    password: string | null;
    reset_password_token: string | null;
    email: string;
    is_active: boolean;
    is_banned: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IRoleModel {
    id: number;
    label: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export interface IDeckModel {
    id: number;
    label: string;
    comment: string | null;
    archetype_id: number;
    user_id: number;
}

export interface ICardModel {
    id: string;
    name: string;
    img_url: string;
    level: number | null;
    atk: number | null;
    def: number | null;
    attribute: string | null;
    type: string | null;
    card_type: string | null;
}

export interface IBanlistModel {
    id: number;
    label: string;
    release_date: Date;
    description: string | null;
}

export interface ICardStatusModel {
    id: number;
    label: string;
}

export interface IDeckCardModel {
    id: number;
    deck_id: number;
    card_id: number;
    quantity: number;
    created_at: Date;
    updated_at: Date;
}

export interface IArchetypeTypeModel {
    archetype_id: number;
    type_id: number;
}

export interface IArchetypeAttributeModel {
    archetype_id: number;
    attribute_id: number;
}

export interface IArchetypeSummonMechanicModel {
    archetype_id: number;
    summonmechanic_id: number;
}

export interface IBanlistArchetypeCardModel {
    explanation_text: string;
    archetype_id: number | null;
    card_id: string;
    card_status_id: number;
    banlist_id: number;
}

// Types pour les entrées
export type IArchetypeModelInput = Omit<IArchetypeModel, 'id' | 'created_at' | 'updated_at'>;
export type IUserModelInput = Omit<IUserModel, 'id' | 'created_at' | 'updated_at'>;
export type IDeckModelInput = Omit<IDeckModel, 'id'>;
export type ICardModelInput = Omit<ICardModel, 'id'>;
export type IBanlistModelInput = Omit<IBanlistModel, 'id'>;
export type IDeckCardModelInput = Omit<IDeckCardModel, 'id' | 'created_at' | 'updated_at'>;
export type IArchetypeTypeModelInput = IArchetypeTypeModel;
export type IArchetypeAttributeModelInput = IArchetypeAttributeModel;
export type IArchetypeSummonMechanicModelInput = IArchetypeSummonMechanicModel;
export type IBanlistArchetypeCardModelInput = Omit<IBanlistArchetypeCardModel, 'id'>;
export type IAttributeModelInput = Omit<IAttributeModel, 'id'>;
export type ISummonMechanicModelInput = Omit<ISummonMechanicModel, 'id'>;
export type ICardTypeModelInput = Omit<ICardTypeModel, 'id' | 'created_at' | 'updated_at'>;
export type ICardStatusModelInput = Omit<ICardStatusModel, 'id'>;
export type IRoleModelInput = Omit<IRoleModel, 'id' | 'created_at' | 'updated_at'>; 