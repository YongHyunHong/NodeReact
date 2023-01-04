const express = require('express');
const router = express.Router();
const multer = require('multer'); // 파일 업로드를 위한 npm, 가져온 사진을 저장하는데 필요
const { Product } = require("../models/Product");

//=================================
//             Product
//=================================

// multer 모듈을 통해서 post로 전송된 파일의 저장경로와 파일명 등을 처리하기 위해서는 diskStorage 엔진이 필요
var storage = multer.diskStorage({
    // destination은 파일이 어디에 저장될 지 결정. 우리는 uploads라는 폴더에 넣을 것
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    // 파일 저장시 어떠한 이름으로 저장할지 설정
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`) // cb 콜백함수를 통해 전송된 파일 이름 설정, 현재날짜_원본파일명의 조합으로 파일 이름 생성
    }
})

var upload = multer({ storage: storage }).single("file")

// index.js에서 /api/product를 이미 타고왔기 때문에, /image만 적어주면 OK
router.post('/image', (req, res) => {
    //가져온 이미지를 저장을 해주면 된다.
    upload(req, res, err => {
        if (err) {
            return req.json({ success: false, err })
        }
        // 업로드 시 에러가 없으면 파일 경로와 파일 이름을 전달 (백엔드에서 프론트엔드로 파일이 저장되었음을 알릴 때 필요)
        return res.json({ success: true, filePath: res.req.file.path, fileName: res.req.file.filename })
    })

})

// 받아온 정보를 DB에 넣기 위한 작업
// index.js에서 이미 /api/product를 타고 왔기 때문에, /만 있어도 OK
router.post('/', (req, res) => {
    // client의 UploadProductPage.js의 Axios.post('/api/product', body)에서 받아온 정보들을 DB에 넣어 준다.
    const product = new Product(req.body) // Product는 Product.js에서 가져온 것. req.body를 통해 Product의 스키마를 채운다.

    product.save((err) => {
        if (err) return res.status(400).json({ success: false, err })
        return res.status(200).json({ success: true })
    })
})

// 정렬 순서 : https://www.inflearn.com/questions/143367/%EB%9E%9C%EB%94%A9-%ED%8E%98%EC%9D%B4%EC%A7%80%EC%97%90-%EC%83%81%ED%92%88%EB%93%A4%EC%9D%84-%EC%A0%95%EB%A0%AC%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95
// LandingPage.js에서 설정한 endpointer와 맞춰주기 위해 /products로 설정
router.post('/products', (req, res) => {
    // post request를 이용해서 필요한 값을 프론트엔드에서 가져올 때엔 req.body.~을 사용하지만, get request에서는 req.query.~를 사용!!
    let order = req.body.order ? req.body.order : "desc";   // .order = 정렬 방법 : 내림차순
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id"; // .sortBy = 기준 칼럼 : id
    // LandingPage.js에서 보내온 skip과 limit 정보를 받아옴
    let limit = req.body.limit ? parseInt(req.body.limit) : 20; // limit이 존재하면 parseInt(req.body.limit)을 통해 limit을 숫자로 변경, 존재하지 않으면 20으로 설정
    let skip = req.body.skip ? parseInt(req.body.skip) : 0; // skip이 존재하면 skip을 숫자로 변경, 존재하지 않으면 0으로 설정
    let term = req.body.searchTerm // 물품 검색, LandingPage.js의 searchTerm, 검색된 상품명이 term으로 들어감

    let findArgs = {}; // object 한 개 정의

    // LandingPage.js에서 showFIlteredResults의 filters, filters에넌 restauranttype과 price가 들어있으므로, key는 restauranttype 또는 price를 의미
    for (let key in req.body.filters) {
        // key가 한 개 이상 들어있는 경우
        if (req.body.filters[key].length > 0) {

            console.log('key', key)

            if (key === "price") {
                findArgs[key] = {
                    // Datas.js에서 array에서 0~199라면 0과 199를 포함한 사이의 값을 넣기 위해 아래의 코드 사용
                    //Greater than equal
                    $gte: req.body.filters[key][0], // 0
                    //Less than equal
                    $lte: req.body.filters[key][1]  // 199
                }
            } else {
                findArgs[key] = req.body.filters[key]; // restauranttype인 경우 체크박스를 누른 애들을 findArgs에 넣기
            }
        }
    }

    // 물품 검색이 되었다면
    if (term) {
        // DB에서 product collection에 들어 있는 모든 상품 정보를 가져오기 => Product.find()
        Product.find(findArgs)
            .find({ $text: { $search: term } }) // 아래의 else구문과 달리 .find가 하나 더 들어감! LandingPage구현하는 강의 맨 마지막꺼 7분
            .populate("writer") // id를 통해 writer에 대한 모든 정보를 가져올 수 있음
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            // .exec를 통해 쿼리를 실행
            .exec((err, productInfo) => {
                if (err) return res.status(400).json({ success: false, err })
                return res.status(200).json({
                    success: true, productInfo,
                    postSize: productInfo.length
                }) // 이 정보를 프론트에서 받기 위해서는 다시 LandingPage.js로 가서 response.data문으로 처리
            })
    // 물품이 검색되지 않았다면
    } else {
        Product.find(findArgs)
            .populate("writer")
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            .exec((err, productInfo) => {
                if (err) return res.status(400).json({ success: false, err })
                return res.status(200).json({
                    success: true, productInfo,
                    postSize: productInfo.length // postSize는 productInfo.length로 정의
                })
            })
    }

})


// DetailProductPage에서 get request를 요청하면, 여기서 처리. id=123123123,324234234,324234234  type=array
router.get('/products_by_id', (req, res) => {
    // post request를 이용해서 필요한 값을 프론트엔드에서 가져올 때엔 req.body.~을 사용하지만, get request에서는 req.query.~를 사용!!
    let type = req.query.type
    let productIds = req.query.id

    if (type === "array") {
        //id=123123123,324234234,324234234 이거를 
        //productIds = ['123123123', '324234234', '324234234'] 이런식으로 바꿔주기
        let ids = req.query.id.split(',')
        productIds = ids.map(item => {
            return item
        })

    }

    //productId를 이용해서 DB에서  productId와 같은 상품의 정보를 가져온다.
    Product.find({ _id: { $in: productIds } })
        .populate('writer') // writer의 모든 정보를 가져와서 읽는다
        // 쿼리를 실행한다
        .exec((err, product) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send(product)
        })
})

// routes폴더 안의 파일로, 라우터 기능을 하므로, exports router
module.exports = router;