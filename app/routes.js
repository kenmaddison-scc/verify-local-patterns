var express = require('express')
var router = express.Router()
var MobileDetect = require('mobile-detect')

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

router.get('/service-patterns/parking-permit/example-service/unverified-address', function(req, res){
   req.session.data.unverifiedAddress = true;
   res.render('service-patterns/parking-permit/example-service/unverified-address');
})

// make radio-group button routes work

router.get('*/example-service/*', function (req, res, next) {
    md = new MobileDetect(req.headers['user-agent']);
    res.locals.userAgent = md

    var radioGroup = req.query['radio-group'];

    if (radioGroup) {
      res.redirect(radioGroup);
    } else {
      next()
    }

});

// add your routes here

router.all('/service-patterns/parking-permit/example-service/pre-payment', function (req, res) {

  function makeStartDate(permitWait, requestedDate) {
    let earliestDate = new Date()
    earliestDate.setDate(earliestDate.getDate() + Number(permitWait || 0))
    if (requestedDate < earliestDate) return earliestDate
    return requestedDate
  }

  function makeEndDate(startDate, length) {
    var date = new Date(startDate.getTime())
    if(req.session.data.unverifiedAddress){
      date.setMonth(date.getMonth() + 3)
    }else{
      date.setMonth(date.getMonth() + (length === '6 months' ? 6 : 12))
    }
    return date
  }

  function makeDate(permitStartDate) {
    if (permitStartDate && permitStartDate.year !== '' && permitStartDate.month !== '' && permitStartDate.day !== '')
      return new Date(permitStartDate.year, permitStartDate.month - 1, permitStartDate.day)
    return new Date()
  }

  function makeCost(length, permitCostForNthPermit, permitsCosts) {
    let cost = permitCostForNthPermit === undefined ? permitsCosts[permitsCosts.length - 1] : permitCostForNthPermit
    if(req.session.data.unverifiedAddress){
      return (cost / (4)).toFixed(2)
    }else{
      return (cost / (length === '6 months' ? 2 : 1)).toFixed(2)
    }
  }

  const data = req.session.data
  const council = req.session.data.council
  const permitRequests = data.registerNumbers.map((registerNumber, i) => {
    let permitStartDate = data.permitStartDate || {}
    let requestedStartDate = makeDate(permitStartDate[data.permitStartChoice] && (permitStartDate[data.permitStartChoice][i] || permitStartDate[data.permitStartChoice][0]))
    let startDate = makeStartDate(council.permitWait, requestedStartDate)
    if(req.session.data.unverifiedAddress){
      console.log('tttttt');
      length = '3 months'
    }else{
      length = data.permitLength === 'multi-lengths' ? data.permitLengths[i] : data.permitLength
    }
    return {
      registerNumber: registerNumber,
      startDate: startDate,
      endDate: makeEndDate(startDate, length),
      length: length,
      cost: makeCost(length, council.permitsCosts[i], council.permitsCosts)
    }
  })

  req.session.data.permitRequestData = {
    permitRequests: permitRequests,
    totalSum: permitRequests.reduce((sum, permit) => sum + Number(permit.cost), 0).toFixed(2)
  }

  res.render('service-patterns/parking-permit/example-service/pre-payment', req.session.data.permitRequestData)
})

router.get('/service-patterns/concessionary-travel/example-service/add-poa', function(req, res) {
  req.session.skip_verify = true

  res.render('service-patterns/concessionary-travel/example-service/add-poa')
})

router.get('/service-patterns/concessionary-travel/example-service/photo/success', function(req, res) {
  res.render('service-patterns/concessionary-travel/example-service/photo/success', { skip_verify: req.session.skip_verify})
})


router.get('/service-patterns/concessionary-travel/example-service/add-poa', function(req, res) {
  req.session.skip_verify = true

  res.render('service-patterns/concessionary-travel/example-service/add-poa')
})

router.get('/service-patterns/concessionary-travel/example-service/photo/success', function(req, res) {
  res.render('service-patterns/concessionary-travel/example-service/photo/success', { skip_verify: req.session.skip_verify})
})

module.exports = router
