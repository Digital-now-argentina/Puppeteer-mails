var express = require('express');
var router = express.Router();

var puppetController = require('../controllers/puppetController');

/* GET home page. */
router.get('/', puppetController.index);

router.post('/links', puppetController.getLinks);

router.post('/mails', puppetController.getMails);

router.post('/save', puppetController.saveMails);

router.post('/proxytest', puppetController.testProxy);

router.get('/consult', puppetController.consultBin);



module.exports = router;
