const mongoose = require('../db/conn')
const Pet = require('../models/Pet')
const getToken = require('../helpers/get-tokens')
const getUserByToken = require('../helpers/get-user-by-token')
const { success, fail } = require('../helpers/http-response')

module.exports = class PetController {
  static async create(req, res) {
    try {
      const { name, age, weight, color } = req.body

      if (!name) return fail(res, { status: 422, message: 'O nome é obrigatório.' })
      if (!age) return fail(res, { status: 422, message: 'A idade é obrigatória.' })
      if (!weight) return fail(res, { status: 422, message: 'O peso é obrigatório.' })
      if (!color) return fail(res, { status: 422, message: 'A cor é obrigatória.' })

      if (!req.files || req.files.length === 0) {
        return fail(res, { status: 422, message: 'As imagens são obrigatórias.' })
      }

      const images = req.files.map((file) => file.filename)

      const token = getToken(req)
      const user = await getUserByToken(token)

      const pet = new Pet({
        name,
        age,
        weight,
        color,
        images,
        available: true,
        user: user._id,
      })

      const newPet = await pet.save()
      return success(res, {
        status: 201,
        message: 'Pet cadastrado com sucesso!',
        data: newPet,
      })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao cadastrar pet.',
        errors: error?.message ?? error,
      })
    }
  }

  static async getAll(req, res) {
    try {
      const pets = await Pet.find()
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return success(res, { status: 200, data: pets })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao buscar pets.',
        errors: error?.message ?? error,
      })
    }
  }

  static async getAllUserPets(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      const pets = await Pet.find({ user: user._id })
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return success(res, { status: 200, data: pets })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao buscar seus pets.',
        errors: error?.message ?? error,
      })
    }
  }

  static async getAllUserAdoptions(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      const pets = await Pet.find({ adopter: user._id })
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return success(res, { status: 200, data: pets })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao buscar suas adoções.',
        errors: error?.message ?? error,
      })
    }
  }

  static async getPetById(req, res) {
    try {
      const id = req.params.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(res, { status: 422, message: 'ID inválido.' })
      }

      const pet = await Pet.findById(id)
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      if (!pet) return fail(res, { status: 404, message: 'Pet não encontrado.' })

      return success(res, { status: 200, data: pet })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao buscar pet.',
        errors: error?.message ?? error,
      })
    }
  }

  static async removePetById(req, res) {
    try {
      const id = req.params.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(res, { status: 422, message: 'ID inválido.' })
      }

      const token = getToken(req)
      const user = await getUserByToken(token)

      const pet = await Pet.findById(id)

      if (!pet) return fail(res, { status: 404, message: 'Pet não encontrado.' })

      if (pet.user.toString() !== user._id.toString()) {
        return fail(res, { status: 403, message: 'Acesso negado.' })
      }

      await Pet.findByIdAndDelete(id)
      return success(res, { status: 200, message: 'Pet removido com sucesso!' })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao remover pet.',
        errors: error?.message ?? error,
      })
    }
  }

  static async updatePet(req, res) {
    try {
      const id = req.params.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(res, { status: 422, message: 'ID inválido.' })
      }

      const token = getToken(req)
      const user = await getUserByToken(token)

      const { name, age, weight, color } = req.body

      const updateData = {}

      // Atualiza apenas campos enviados (regra: update parcial)
      if (name) updateData.name = name
      if (age) updateData.age = age
      if (weight) updateData.weight = weight
      if (color) updateData.color = color

      // Se enviar novas imagens: substituir imagens antigas (no banco)
      if (req.files && req.files.length > 0) {
        updateData.images = req.files.map((file) => file.filename)
      }

      const pet = await Pet.findById(id)

      if (!pet) return fail(res, { status: 404, message: 'Pet não encontrado.' })

      if (pet.user.toString() !== user._id.toString()) {
        return fail(res, { status: 403, message: 'Acesso negado.' })
      }

      const updatedPet = await Pet.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      return success(res, {
        status: 200,
        message: 'Pet atualizado com sucesso!',
        data: updatedPet,
      })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao atualizar pet.',
        errors: error?.message ?? error,
      })
    }
  }

  static async schedule(req, res) {
    try {
      const id = req.params.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(res, { status: 422, message: 'ID inválido.' })
      }

      const token = getToken(req)
      const user = await getUserByToken(token)

      const pet = await Pet.findById(id).populate('user', 'name phone image')

      if (!pet) return fail(res, { status: 404, message: 'Pet não encontrado.' })

      // dono não pode agendar adoção do próprio pet
      if (pet.user._id.toString() === user._id.toString()) {
        return fail(res, {
          status: 403,
          message: 'Você não pode agendar uma visita para o seu próprio pet.',
        })
      }

      // Pet já foi adotado/concluído
      if (pet.adopted || !pet.available) {
        return fail(res, { status: 422, message: 'Este pet não está disponível no momento.' })
      }

      // Já existe um adotante/visita marcada (evita múltiplas pessoas agendando)
      if (pet.adopter) {
        return fail(res, {
          status: 422,
          message: 'Este pet já possui uma visita agendada.',
        })
      }

      pet.adopter = user._id

      await pet.save()

      return success(res, {
        status: 200,
        message: `Visita agendada com sucesso! Entre em contato com o(a) dono(a): ${pet.user.name}`,
        data: pet,
      })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao agendar visita.',
        errors: error?.message ?? error,
      })
    }
  }

  static async concludeAdoption(req, res) {
    try {
      const id = req.params.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return fail(res, { status: 422, message: 'ID inválido.' })
      }

      const token = getToken(req)
      const user = await getUserByToken(token)

      const pet = await Pet.findById(id).populate('user', 'name phone image')

      if (!pet) return fail(res, { status: 404, message: 'Pet não encontrado.' })

      if (pet.user._id.toString() !== user._id.toString()) {
        return fail(res, { status: 403, message: 'Acesso negado.' })
      }

      if (!pet.adopter) {
        return fail(res, {
          status: 422,
          message: 'Este pet ainda não possui um adotante/visita agendada.',
        })
      }

      pet.available = false
      pet.adopted = true

      await pet.save()

      return success(res, {
        status: 200,
        message: 'Adoção finalizada com sucesso!',
        data: pet,
      })
    } catch (error) {
      return fail(res, {
        status: 500,
        message: 'Erro ao concluir adoção.',
        errors: error?.message ?? error,
      })
    }
  }
}

