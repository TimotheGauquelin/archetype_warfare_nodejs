import Archetype from '../models/ArchetypeModel.js';
import Era from '../models/EraModel.js';
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
        const {
            name,
            main_info,
            slider_info,
            in_tcg_date,
            in_aw_date,
            era,
            attributes = [], // Array d'objets {id, label}
            types = [], // Array d'objets {id, label}
            summon_mechanics = [], // Array d'objets {id, label}
            cards = [], // Array d'objets BanlistArchetypeCard
            slider_img_url,
            card_img_url
        } = request.body;

        try {

            if (!name || !main_info || !slider_info || !in_tcg_date || !in_aw_date || !era) {
                return response.status(400).json({
                    success: false,
                    message: 'Les champs Nom, Information principale, Information slider, Date d\'apparition TCG, Date d\'apparition AW, Points de popularité, Ere sont obligatoires'
                });
            }

            if (!summon_mechanics || summon_mechanics.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Au moins une méthode d\'invocation doit être ajouté'
                });
            }

            if (!types || types.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Au moins un type doit être ajouté'
                });
            }

            if (!attributes || attributes.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Au moins un attribut doit être ajouté'
                });
            }

            const existingArchetype = await Archetype.findOne({
                where: { name: name }
            });

            if (existingArchetype) {
                return response.status(409).json({
                    success: false,
                    message: 'Un archétype avec ce nom existe déjà'
                });
            }

            const existingEra = await Era.findByPk(era.id);
            if (!existingEra) {
                return response.status(400).json({
                    success: false,
                    message: 'L\'ère spécifiée n\'existe pas'
                });
            }

            const result = await ArchetypeService.addArchetype(request, response, next);
            if (result) {
                return response.status(201).json({
                    success: true,
                    message: 'Archétype créé avec succès',
                });
            }

        } catch (error) {
            next(error);
        }
    }

    // PUT

    async updateArchetype(request, response, next) {

        const {
            id,
            name,
            main_info,
            slider_info,
            in_tcg_date,
            in_aw_date,
            era, // Peut être un objet {id, label} ou un simple ID
        } = request.body;

        try {

            if (!id || !name || !main_info || !slider_info || !in_tcg_date || !in_aw_date || !era.id) {
                return response.status(400).json({
                    success: false,
                    message: 'Les champs Nom, Date d\'apparition TCG, Date d\'apparition AW, Ere, Information principale, Information slider sont obligatoires'
                });
            }

            const existingArchetype = await Archetype.findByPk(id);
            if (!existingArchetype) {
                return response.status(404).json({
                    success: false,
                    message: 'Archétype non trouvé'
                });
            }

            const era_id = await Era.findByPk(era.id);
            if (!era_id) {
                return response.status(400).json({
                    success: false,
                    message: 'L\'era spécifiée n\'existe pas'
                });
            }

            const result = await ArchetypeService.updateArchetype(request, response, next);
            if (result) {
                return response.status(200).json({
                    success: true,
                    message: 'Archétype mis à jour avec succès',
                });
            }

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