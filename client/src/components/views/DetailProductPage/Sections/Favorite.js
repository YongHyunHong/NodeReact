// 상위 컴포넌트는 DetailProductPage, 즐겨찾기 리스트를 만들기 위한 버튼을 관리

import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { Button } from 'antd';

function Favorite(props) {

    const productId = props.productId // DetailProductPage에서 props를 설정할 때 productId로 설정했기 때문에 이렇게 코딩
    const userFrom = props.userFrom     // userFrom은 DetailProductPage에서 가져온 것
    const productTitle = props.productInfo.title    // productInfo는 DetailProductPage에서 가져온 것
    const productTypes = props.productInfo.restaurantTypes
    const productPrice = props.productInfo.price


    const [FavoriteNumber, setFavoriteNumber] = useState(0)
    const [Favorited, setFavorited] = useState(false)

    // 얘네가 post request의 argument로 들어감
    let variables = {
        userFrom: userFrom, // 누가 좋아요를 눌렀는지
        productId: productId,   // 어떤 상품을 좋아요를 눌렀는지
        productTitle: productTitle, // 식당명
        productTypes: productTypes, // 식당의 분류
        productPrice: productPrice  // 음식의 가격
    }

    // 얼마나 많은 사람이 이 식당을 Favorite 리스트에 넣었는지 그 숫자 정보를 얻기 위한 코드
    useEffect(() => {

        // 좋아요 수를 얻기 위한 endpointer 지정, server/routes/favorite.js에서 post request에 맞는 endpointer 지정
        Axios.post('/api/favorite/favoriteNumber', variables)
            // 프론트에서 백으로 response
            .then(response => {
                setFavoriteNumber(response.data.favoriteNumber)
                if (response.data.success) {
                } else {
                    alert('숫자 정보를 가져오는데 실패 했습니다.')
                }
            })

        // 내가 이 식당을 이미 Favorite 리스트에 넣었는지 아닌지에 대한 정보를 얻기 위한 코드
        Axios.post('/api/favorite/favorited', variables)
            .then(response => {
                if (response.data.success) {
                    setFavorited(response.data.favorited)
                } else {
                    alert('정보를 가져오는데 실패 했습니다.')
                }
            })



    }, [])


    const onClickFavorite = () => {

        if (Favorited) {
            Axios.post('/api/favorite/removeFromFavorite', variables)
                .then(response => {
                    if (response.data.success) {
                        setFavoriteNumber(FavoriteNumber - 1)
                        setFavorited(!Favorited)
                    } else {
                        alert('Favorite 리스트에서 지우는 걸 실패했습니다.')
                    }
                })


        } else {
            Axios.post('/api/favorite/addToFavorite', variables)
                .then(response => {
                    if (response.data.success) {
                        setFavoriteNumber(FavoriteNumber + 1)
                        setFavorited(!Favorited)

                    } else {
                        alert('Favorite 리스트에서 추가하는 걸 실패했습니다.')
                    }
                })
        }

    }



    return (
        <div>
            {/* Favorited가 True인 경우 Not Favorite, False인 경우 Add to Favorite / FavoriteNumber를 통해 좋아요 늘러진 수도 함께 표기 */}
            <Button onClick={onClickFavorite}>{Favorited ? " Not Favorite" : "Add to Favorite "}  {FavoriteNumber}  </Button>

        </div>
    )
}

export default Favorite