import { Request, Response } from 'express';
import { ITypeModel, ICardModel, IArchetypeModel, IEraModel, IAttributeModel, ISummonMechanicModel, IUserModel, IRoleModel, IDeckModel, IDeckCardModel, ICardStatusModel, IBanlistModel, IBanlistArchetypeCardModel } from './models.js';

export interface ITypeService {
    getTypes(request: Request, response: Response): Promise<ITypeModel[]>;
    getTypeById(request: Request, response: Response): Promise<ITypeModel>;
    createType(request: Request, response: Response): Promise<ITypeModel>;
    updateType(request: Request, response: Response): Promise<ITypeModel>;
    deleteType(request: Request, response: Response): Promise<void>;
}

export interface ICardService {
    getCards(request: Request, response: Response): Promise<ICardModel[]>;
    getCardById(request: Request, response: Response): Promise<ICardModel>;
    createCard(request: Request, response: Response): Promise<ICardModel>;
    updateCard(request: Request, response: Response): Promise<ICardModel>;
    deleteCard(request: Request, response: Response): Promise<void>;
}

export interface IArchetypeService {
    getArchetypes(request: Request, response: Response): Promise<IArchetypeModel[]>;
    getArchetypeById(request: Request, response: Response): Promise<IArchetypeModel>;
    createArchetype(request: Request, response: Response): Promise<IArchetypeModel>;
    updateArchetype(request: Request, response: Response): Promise<IArchetypeModel>;
    deleteArchetype(request: Request, response: Response): Promise<void>;
}

export interface IEraService {
    getEras(request: Request, response: Response): Promise<IEraModel[]>;
    getEraById(request: Request, response: Response): Promise<IEraModel>;
    createEra(request: Request, response: Response): Promise<IEraModel>;
    updateEra(request: Request, response: Response): Promise<IEraModel>;
    deleteEra(request: Request, response: Response): Promise<void>;
}

export interface IAttributeService {
    getAttributes(request: Request, response: Response): Promise<IAttributeModel[]>;
    getAttributeById(request: Request, response: Response): Promise<IAttributeModel>;
    createAttribute(request: Request, response: Response): Promise<IAttributeModel>;
    updateAttribute(request: Request, response: Response): Promise<IAttributeModel>;
    deleteAttribute(request: Request, response: Response): Promise<void>;
}

export interface ISummonMechanicService {
    getSummonMechanics(request: Request, response: Response): Promise<ISummonMechanicModel[]>;
    getSummonMechanicById(request: Request, response: Response): Promise<ISummonMechanicModel>;
    createSummonMechanic(request: Request, response: Response): Promise<ISummonMechanicModel>;
    updateSummonMechanic(request: Request, response: Response): Promise<ISummonMechanicModel>;
    deleteSummonMechanic(request: Request, response: Response): Promise<void>;
}

export interface IUserService {
    getUsers(request: Request, response: Response): Promise<IUserModel[]>;
    getUserById(request: Request, response: Response): Promise<IUserModel>;
    createUser(request: Request, response: Response): Promise<IUserModel>;
    updateUser(request: Request, response: Response): Promise<IUserModel>;
    deleteUser(request: Request, response: Response): Promise<void>;
    authenticateUser(request: Request, response: Response): Promise<{ token: string; user: IUserModel }>;
    resetPassword(request: Request, response: Response): Promise<void>;
}

export interface IRoleService {
    getRoles(request: Request, response: Response): Promise<IRoleModel[]>;
    getRoleById(request: Request, response: Response): Promise<IRoleModel>;
    createRole(request: Request, response: Response): Promise<IRoleModel>;
    updateRole(request: Request, response: Response): Promise<IRoleModel>;
    deleteRole(request: Request, response: Response): Promise<void>;
}

export interface IDeckService {
    getDecks(request: Request, response: Response): Promise<IDeckModel[]>;
    getDeckById(request: Request, response: Response): Promise<IDeckModel>;
    createDeck(request: Request, response: Response): Promise<IDeckModel>;
    updateDeck(request: Request, response: Response): Promise<IDeckModel>;
    deleteDeck(request: Request, response: Response): Promise<void>;
}

export interface IDeckCardService {
    getDeckCards(request: Request, response: Response): Promise<IDeckCardModel[]>;
    getDeckCardById(request: Request, response: Response): Promise<IDeckCardModel>;
    createDeckCard(request: Request, response: Response): Promise<IDeckCardModel>;
    updateDeckCard(request: Request, response: Response): Promise<IDeckCardModel>;
    deleteDeckCard(request: Request, response: Response): Promise<void>;
}

export interface ICardStatusService {
    getCardStatuses(request: Request, response: Response): Promise<ICardStatusModel[]>;
    getCardStatusById(request: Request, response: Response): Promise<ICardStatusModel>;
    createCardStatus(request: Request, response: Response): Promise<ICardStatusModel>;
    updateCardStatus(request: Request, response: Response): Promise<ICardStatusModel>;
    deleteCardStatus(request: Request, response: Response): Promise<void>;
}

export interface IBanlistService {
    getBanlists(request: Request, response: Response): Promise<IBanlistModel[]>;
    getBanlistById(request: Request, response: Response): Promise<IBanlistModel>;
    createBanlist(request: Request, response: Response): Promise<IBanlistModel>;
    updateBanlist(request: Request, response: Response): Promise<IBanlistModel>;
    deleteBanlist(request: Request, response: Response): Promise<void>;
}

export interface IBanlistArchetypeCardService {
    getBanlistArchetypeCards(request: Request, response: Response): Promise<IBanlistArchetypeCardModel[]>;
    getBanlistArchetypeCardById(request: Request, response: Response): Promise<IBanlistArchetypeCardModel>;
    createBanlistArchetypeCard(request: Request, response: Response): Promise<IBanlistArchetypeCardModel>;
    updateBanlistArchetypeCard(request: Request, response: Response): Promise<IBanlistArchetypeCardModel>;
    deleteBanlistArchetypeCard(request: Request, response: Response): Promise<void>;
} 