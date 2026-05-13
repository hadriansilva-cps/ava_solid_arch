const mongoose = require('../db/conn')
const { Schema } = mongoose

const Pet = mongoose.model(
    'Pet',
    new Schema(
        {
            name: {
                type: String,
                required: true
            },
            age: {
                type: Number,
                required: true
            },
            weight: {
                type: Number,
                required: true
            },
            color: {
                type: String,
                required: true
            },
            images: {
                type: [String],
                required: true
            },
            available: {
                type: Boolean,
                default: true
            },
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            adopter: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            adopted: {
                type: Boolean,
                default: false,
            },
        },
        {
            timestamps: true
        }
    )
)

module.exports = Pet
