const express = require('express')
const cors = require('cors')
const UserRouters = require('./routers/UserRouters')
const PetRoutes = require('./routers/PetRoutes')

require('./db/conn')

const app = express()

app.use(express.json())

app.use(cors({ credentials: true, origin: true }))

app.use(express.static('public'))

app.use('/users', UserRouters)
app.use('/pets', PetRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT)
