const Jdenticon = require("jdenticon")
const { prisma } = require("../prisma/prisma-client.js")
const bcrypt = require("bcrypt")
const path = require("path")
const fs = require("fs")
const jwt = require('jsonwebtoken')

const UserController = {
   register: async (req, res) => {
      const { email, password, name } = req.body

      if (!email || !password || !name) {
         return res.status(400).json({ error: 'Все поля обязательны' })
      }

      try {
         const existingUser = await prisma.user.findUnique(({ where: { email } }))

         if (existingUser) {
            return res.status(400).json({ error: 'пользователь уже существует' })
         }

         const hashedPassword = await bcrypt.hash(password, 10)

         const png = Jdenticon.toPng(name, 200)
         const avatarName = `${name}_${Date.now()}.png`
         const avatarPath = path.join(__dirname, '../uploads', avatarName)
         fs.writeFileSync(avatarPath, png)

         const user = await prisma.user.create({
            data: {
               email,
               password: hashedPassword,
               name,
               avatarUrl: `/uploads/${avatarPath}`
            }
         })

         res.json(user)

      } catch (err) {
         console.error('Error in register', err)
         res.status(500).json({ error: 'Internal server error' })
      }

      res.send(`${email}, ${password}, ${name}`)
   },
   login: async (req, res) => {
      const { email, password } = req.body

      if (!email || !password) {
         return res.status(400).json({ error: 'Все поля обязательны' })
      }

      try {
         const user = await prisma.user.findUnique({ where: { email } })
         if (!user) {
            return res.status(400).json({ error: 'Неверный логин или пароль' })
         }

         const valid = await bcrypt.compare(password, user.password)

         if (!valid) {
            return res.status(400).json({ error: 'Неверный логин или пароль' })
         }

         const token = jwt.sign(({ userId: user.id }), process.env.SECRET_KEY)

         res.json({ token })

      } catch (err) {
         console.error('login error', err)
         res.status(500).json({ error: 'Internal server error' })
      }

   },
   getUserById: async () => { },
   updateUser: async () => { },
   current: async () => { },
}

module.exports = UserController