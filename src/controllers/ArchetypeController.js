import Archetype from '../models/ArchetypeModel.js';
import ArchetypeService from '../services/ArchetypeService.js';

class ArchetypeController {
    async searchArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.searchArchetypes(request, response, next);
            return response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getArchetypeById(request, response, next) {
        try {
            const { id } = request.params;
            const archetype = await ArchetypeService.getArchetypeById(id, next);
            return response.status(200).json(archetype);
        } catch (error) {
            next(error);
        }
    }

    async getEightMostFamousArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.getEightMostFamousArchetypes(request, response, next);
            return response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getEightMostRecentArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.getEightMostRecentArchetypes(request, response, next);
            return response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getFiveRandomHighlightedArchetypes(request, response, next) {

        try {
            const archetypes = await ArchetypeService.getFiveRandomHighlightedArchetypes(request, response, next);
            return response.status(200).json(archetypes);
        } catch (error) {
            next(error);
        }
    }

    async getRandomArchetype(request, response, next) {
        try {
            const archetype = await ArchetypeService.getRandomArchetype(next);
            return response.status(200).json(archetype);
        } catch (error) {
            next(error);
        }
    }

    // ADD

    async addArchetype(request, response, next) {

        try {
            const archetype = await ArchetypeService.addArchetype(request, response, next);
            return archetype;

        } catch (error) {
            next(error);
        }
    }

    // PUT

    async updateArchetype(request, response, next) {
        try {
            await ArchetypeService.updateArchetype(request, response, next);
        } catch (error) {
            next(error);
        }
    }

    async switchIsHighlighted(request, response, next) {

        const { archetypeId } = request.params;

        try {

            const isExist = await Archetype.findByPk(archetypeId);
            if (isExist) {
                await ArchetypeService.switchIsHighlighted(archetypeId, next);
                return response.status(200).json({
                    message: 'Archétype modifié !'
                });
            }

        } catch (error) {
            next(error);
        }
    }

    async switchIsActive(request, response, next) {

        const { archetypeId } = request.params;

        try {

            const isExist = Archetype.findByPk(archetypeId);

            if (isExist) {
                await ArchetypeService.switchIsActive(archetypeId, next);
                return response.status(200).json({
                    message: 'Archétype modifié !'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    // PUT ALL

    async switchAllToIsNotHighlighted(request, response, next) {

        try {
            await ArchetypeService.switchAllToIsNotHighlighted(next);
            return response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    async switchAllToIsUnactive(request, response, next) {

        try {
            await ArchetypeService.switchAllToIsUnactive(next);
            return response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPopularity(request, response, next) {

        try {
            await ArchetypeService.resetPopularity(next);
            return response.status(200).json({
                message: 'Archétype modifié !'
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE

    async deleteArchetype(request, response, next) {

        const { archetypeId } = request.params;

        try {

            console.log("CONTROLLER ====== archetypeId", archetypeId);

            const isExist = Archetype.findByPk(archetypeId);

            if (isExist) {
                await ArchetypeService.deleteArchetype(archetypeId, next);
                return response.status(200).json({
                    message: 'Archétype supprimé !'
                });
            }

        } catch (error) {
            next(error);
        }
    }
}

export default new ArchetypeController();