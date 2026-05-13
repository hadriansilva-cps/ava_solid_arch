const mongoose = require('../db/conn')
const Pet = require('../models/Pet')
const getToken = require('../helpers/get-tokens')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class PetController {
  static async create(req, res) {
    const { name, age, weight, color } = req.body

    if (!name) return res.status(422).json({ message: 'O nome é obrigatório.' })
    if (!age) return res.status(422).json({ message: 'A idade é obrigatória.' })
    if (!weight) return res.status(422).json({ message: 'O peso é obrigatório.' })
    if (!color) return res.status(422).json({ message: 'A cor é obrigatória.' })

    if (!req.files || req.files.length === 0) {
      return res.status(422).json({ message: 'As imagens são obrigatórias.' })
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

    try {
      const newPet = await pet.save()
      return res.status(201).json({
        message: 'Pet cadastrado com sucesso!',
        pet: newPet,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao cadastrar pet.', error })
    }
  }

  static async getAll(req, res) {
    try {
      const pets = await Pet.find()
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return res.status(200).json(pets)
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar pets.', error })
    }
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pets = await Pet.find({ user: user._id })
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return res.status(200).json(pets)
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar seus pets.', error })
    }
  }

  static async getAllUserAdoptions(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pets = await Pet.find({ adopter: user._id })
        .sort('-createdAt')
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      return res.status(200).json(pets)
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar suas adoções.', error })
    }
  }

  static async getPetById(req, res) {
    const id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido.' })
    }

    try {
      const pet = await Pet.findById(id)
        .populate('user', 'name phone image')
        .populate('adopter', 'name phone image')

      if (!pet) return res.status(404).json({ message: 'Pet não encontrado.' })

      return res.status(200).json(pet)
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar pet.', error })
    }
  }

  static async removePetById(req, res) {
    const id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido.' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pet = await Pet.findById(id)

      if (!pet) return res.status(404).json({ message: 'Pet não encontrado.' })

      if (pet.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' })
      }

      await Pet.findByIdAndDelete(id)
      return res.status(200).json({ message: 'Pet removido com sucesso!' })
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao remover pet.', error })
    }
  }

  static async updatePet(req, res) {
    const id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido.' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    const { name, age, weight, color, available } = req.body

    const updateData = {}

    if (name) updateData.name = name
    if (age) updateData.age = age
    if (weight) updateData.weight = weight
    if (color) updateData.color = color
    if (available !== undefined) updateData.available = available

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.filename)
    }

    try {
      const pet = await Pet.findById(id)

      if (!pet) return res.status(404).json({ message: 'Pet não encontrado.' })

      if (pet.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' })
      }

      const updatedPet = await Pet.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      return res.status(200).json({
        message: 'Pet atualizado com sucesso!',
        pet: updatedPet,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao atualizar pet.', error })
    }
  }

  static async schedule(req, res) {
    const id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido.' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pet = await Pet.findById(id).populate('user', 'name phone image')

      if (!pet) return res.status(404).json({ message: 'Pet não encontrado.' })

      // dono não pode agendar adoção do próprio pet
      if (pet.user._id.toString() === user._id.toString()) {
        return res.status(422).json({
          message: 'Você não pode agendar uma visita para o seu próprio pet.',
        })
      }

      if (!pet.available) {
        return res.status(422).json({
          message: 'Este pet não está disponível no momento.',
        })
      }

      pet.adopter = user._id
      pet.available = false

      await pet.save()

      return res.status(200).json({
        message: `Visita agendada com sucesso! Entre em contato com o(a) dono(a): ${pet.user.name}`,
        pet,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao agendar visita.', error })
    }
  }

  static async concludeAdoption(req, res) {
    const id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido.' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pet = await Pet.findById(id).populate('user', 'name phone image')

      if (!pet) return res.status(404).json({ message: 'Pet não encontrado.' })

      if (pet.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' })
      }

      pet.available = false
      pet.adopted = true

      await pet.save()

      return res.status(200).json({
        message: 'Adoção finalizada com sucesso!',
        pet,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao concluir adoção.', error })
    }
  }
}

