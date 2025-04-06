import Archetype from "../models/ArchetypeModel.js";
import ArchetypeService from "../services/ArchetypeService.js";

class ArchetypeController {
    async searchArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.searchArchetypes(request, response, next)
            return response.status(200).json(archetypes)
        } catch (error) {
            next(error)
        }
    }

    async getArchetypeById(request, response, next) {
        try {
            const {id} = request.params
            const archetype = await ArchetypeService.getArchetypeById(id, next)
            return response.status(200).json(archetype)
        } catch (error) {
            next(error)
        }
    }

    async getFiveMostFamousArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.getFiveMostFamousArchetypes(request, response, next)
            return response.status(200).json(archetypes)
        } catch (error) {
            next(error)
        }
    }

    async getEightMostRecentArchetypes(request, response, next) {
        try {
            const archetypes = await ArchetypeService.getEightMostRecentArchetypes(request, response, next)
            return response.status(200).json(archetypes)
        } catch (error) {
            next(error)
        }
    }

    async getFiveRandomHighlightedArchetypes(request, response, next) {

        try {
            const archetypes = await ArchetypeService.getFiveRandomHighlightedArchetypes(request, response, next)
            return response.status(200).json(archetypes)
        } catch (error) {
            next(error)
            response.status(500).json({ message: error.message });
        }
    }

    // ADD

    async addArchetype(request, response) {

        try {

            const archetype = await ArchetypeService.addArchetype(request, response)
            return archetype

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    // PUT

    async updateArchetype(request, response) {

        const { archetypeId } = request.params

        try {

            const isExist = await Archetype.findByPk(archetypeId)
            if (isExist) {
                const archetype = await ArchetypeService.updateArchetype(request, response)
                return archetype
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async switchIsHighlighted(request, response) {

        const { archetypeId } = request.params

        try {

            const isExist = await Archetype.findByPk(archetypeId)
            if (isExist) {
                const archetype = await ArchetypeService.switchIsHighlighted(request, response)
                return archetype
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async switchIsActive(request, response) {

        const { archetypeId } = request.params

        try {

            const isExist = Archetype.findByPk(archetypeId)

            if (isExist) {
                const archetype = await ArchetypeService.switchIsActive(request, response)
                return archetype
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    // PUT ALL

    async switchAllToIsNotHighlighted(request, response) {

        try {

            const archetypes = await ArchetypeService.switchAllToIsNotHighlighted(request, response)
            return archetypes

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async switchAllToIsUnactive(request, response) {

        try {

            const archetypes = await ArchetypeService.switchAllToIsUnactive(request, response)
            return archetypes

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async resetPopularity(request, response) {

        try {

            const archetypes = await ArchetypeService.resetPopularity(request, response)
            return archetypes

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    // DELETE

    async deleteArchetype(request, response) {

        const { archetypeId } = request.params

        try {

            const isExist = Archetype.findByPk(archetypeId)

            if (isExist) {
                const archetype = await ArchetypeService.deleteArchetype(request, response)
                return archetype
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }
}

export default new ArchetypeController()