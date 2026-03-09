import { Request, Response, NextFunction } from 'express';
import Archetype from '../models/ArchetypeModel';
import Era from '../models/EraModel';
import ArchetypeService from '../services/ArchetypeService';
import { getStringParam } from '../utils/request';

class ArchetypeController {
    async searchArchetypes(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                name: request.query.name as string | undefined,
                era: request.query.era ? parseInt(request.query.era as string) : undefined,
                type: request.query.type as string | undefined,
                attribute: request.query.attribute as string | undefined,
                summonmechanic: request.query.summonmechanic as string | undefined,
                page: request.query.page ? parseInt(request.query.page as string) : 1,
                size: request.query.size ? parseInt(request.query.size as string) : 10
            };

            const result = await ArchetypeService.searchArchetypes(filters);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getArchetypeById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const idOrSlug = getStringParam(request.params.id);
            const archetype = await ArchetypeService.getArchetypeByIdOrSlug(idOrSlug);
            response.status(200).json(archetype);
        } catch (error) {
            next(error);
        }
    }

    async getEightMostFamousArchetypes(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetypes = await ArchetypeService.getEightMostFamousArchetypes();
            response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getEightMostRecentArchetypes(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetypes = await ArchetypeService.getEightMostRecentArchetypes();
            response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getFiveRandomHighlightedArchetypes(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetypes = await ArchetypeService.getFiveRandomHighlightedArchetypes();
            response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getRandomArchetype(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetype = await ArchetypeService.getRandomArchetype();
            response.status(200).json(archetype);
        } catch (error) {
            next(error);
        }
    }

    async getAllArchetypeNames(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetypeNames = await ArchetypeService.getAllArchetypeNames();
            response.status(200).json(archetypeNames);
        } catch (error) {
            next(error);
        }
    }

    // ADD
    async addArchetype(request: Request, response: Response, next: NextFunction): Promise<void> {
        const {
            name,
            main_info,
            slider_info,
            in_tcg_date,
            in_aw_date,
            era,
            attributes = [],
            types = [],
            summon_mechanics = []
        } = request.body;

        try {
            if (!name || !main_info || !slider_info || !in_tcg_date || !in_aw_date || !era) {
                response.status(400).json({
                    success: false,
                    message: 'Les champs Nom, Information principale, Information slider, Date d\'apparition TCG, Date d\'apparition AW, Points de popularité, Ere sont obligatoires'
                });
                return;
            }

            if (!summon_mechanics || (Array.isArray(summon_mechanics) && summon_mechanics.length === 0)) {
                response.status(400).json({
                    success: false,
                    message: 'Au moins une méthode d\'invocation doit être ajouté'
                });
                return;
            }

            if (!types || (Array.isArray(types) && types.length === 0)) {
                response.status(400).json({
                    success: false,
                    message: 'Au moins un type doit être ajouté'
                });
                return;
            }

            if (!attributes || (Array.isArray(attributes) && attributes.length === 0)) {
                response.status(400).json({
                    success: false,
                    message: 'Au moins un attribut doit être ajouté'
                });
                return;
            }

            const existingArchetype = await Archetype.findOne({
                where: { name: name }
            });

            if (existingArchetype) {
                response.status(409).json({
                    success: false,
                    message: 'Un archétype avec ce nom existe déjà'
                });
                return;
            }

            const existingEra = await Era.findByPk((era as { id: number }).id);
            if (!existingEra) {
                response.status(400).json({
                    success: false,
                    message: 'L\'ère spécifiée n\'existe pas'
                });
                return;
            }

            await ArchetypeService.addArchetype(request, response);

        } catch (error) {
            next(error);
        }
    }

    // PUT
    async updateArchetype(request: Request, response: Response, next: NextFunction): Promise<void> {
        const archetypeIdParam = getStringParam(request.params.archetypeId);
        try {
            const resolvedId = await ArchetypeService.resolveArchetypeId(archetypeIdParam);
            if (resolvedId == null) {
                response.status(404).json({ success: false, message: 'Archétype non trouvé' });
                return;
            }
            request.body.id = resolvedId;
        } catch (e) {
            response.status(404).json({ success: false, message: 'Archétype non trouvé' });
            return;
        }
        const {
            id,
            name,
            main_info,
            slider_info,
            in_tcg_date,
            in_aw_date,
            era,
        } = request.body;

        try {
            if (!id || !name || !main_info || !slider_info || !in_tcg_date || !in_aw_date || !(era as { id: number })?.id) {
                response.status(400).json({
                    success: false,
                    message: 'Les champs Nom, Date d\'apparition TCG, Date d\'apparition AW, Ere, Information principale, Information slider sont obligatoires'
                });
                return;
            }

            const existingArchetype = await Archetype.findByPk(id);
            if (!existingArchetype) {
                response.status(404).json({
                    success: false,
                    message: 'Archétype non trouvé'
                });
                return;
            }

            const era_id = await Era.findByPk((era as { id: number }).id);
            if (!era_id) {
                response.status(400).json({
                    success: false,
                    message: 'L\'era spécifiée n\'existe pas'
                });
                return;
            }

            await ArchetypeService.updateArchetype(request, response);

        } catch (error) {
            next(error);
        }
    }

    async switchIsHighlighted(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const idOrSlug = getStringParam(request.params.archetypeId);
            const archetype = await ArchetypeService.findByIdOrSlug(idOrSlug);
            if (archetype) {
                await ArchetypeService.switchIsHighlighted(archetype.id);
                response.status(200).json({
                    message: 'Archétype modifié !'
                });
            } else {
                response.status(404).json({ success: false, message: 'Archétype non trouvé' });
            }
        } catch (error) {
            next(error);
        }
    }

    async switchIsActive(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const idOrSlug = getStringParam(request.params.archetypeId);
            const archetype = await ArchetypeService.findByIdOrSlug(idOrSlug);
            if (archetype) {
                await ArchetypeService.switchIsActive(archetype.id);
                response.status(200).json({
                    message: 'Archétype modifié !'
                });
            } else {
                response.status(404).json({ success: false, message: 'Archétype non trouvé' });
            }
        } catch (error) {
            next(error);
        }
    }

    // PUT ALL
    async switchAllToIsNotHighlighted(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            await ArchetypeService.switchAllToIsNotHighlighted();
            response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    async switchAllToIsUnactive(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            await ArchetypeService.switchAllToIsUnactive();
            response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPopularity(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            await ArchetypeService.resetPopularity();
            response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE
    async deleteArchetype(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const idOrSlug = getStringParam(request.params.archetypeId);
            const archetype = await ArchetypeService.findByIdOrSlug(idOrSlug);
            if (archetype) {
                await ArchetypeService.deleteArchetype(archetype.id);
                response.status(200).json({
                    message: 'Archétype supprimé !'
                });
            } else {
                response.status(404).json({ success: false, message: 'Archétype non trouvé' });
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new ArchetypeController();
