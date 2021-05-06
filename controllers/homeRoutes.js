const router = require('express').Router();
const { User, Pet } = require('../models');
const withAuth = require('../utils/withAuth');
const fetch = require('node-fetch');
//generate API token
router.get('/token', async (req, res) => {
  try {
    fetch('https://api.petfinder.com/v2/oauth2/token', {
      method: 'POST',
      body: `grant_type=client_credentials&client_id=${process.env.API_KEY}&client_secret=${process.env.API_SECRET}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(async (result) => {
        const data = await result.json();
        console.log(data);
        res.json(data)
      })
  }
  catch (err) {
    res.status(500).json(err.message);
  }
});
// deliver user data to the front end js
router.get('/userData', async (req, res) => {
  try {
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Pet }],
    })
    res.json(userData);
  }
  catch (err) {
    res.status(500).json(err.message);
  }
});
//
router.get('/', withAuth, async (req, res) => {
  try {
    // Get all pets and join with their shelter data
    const petData = await Pet.findAll({
    });
    // Serialize data so the template can read it
    const allPets = petData.map((pet) => pet.get({ plain: true }));
    // Pass serialized data and session flag into template
    console.log(allPets)

    res.render('homepage', {
      allpets: allPets,
      logged_in: req.session.logged_in
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});
router.get('/pet/:id', async (req, res) => {
  try {
    const petData = await Pet.findByPk(req.params.id, {
    });
    const individualPet = petData.get({ plain: true });
    res.render('individualPet', {
      ...individualPet,
      logged_in: req.session.logged_in
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
// Use withAuth middleware to prevent access to route
router.get('/dashboard', withAuth, async (req, res) => {
  try {
    // Find the logged in user based on the session ID
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Pet }],
    });
    const user = userData.get({ plain: true });
    res.render('dashboard', {
      ...user,
      logged_in: true
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get('/login', (req, res) => {
  // If the user is already logged in, redirect the request to another route
  if (req.session.logged_in) {
    res.redirect('/dashboard');
    return;
  }
  res.render('login');
});
module.exports = router;