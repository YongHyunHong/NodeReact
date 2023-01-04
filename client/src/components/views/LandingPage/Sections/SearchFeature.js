// 원하는 메뉴를 검색창에 검색하는 페이지

import React, { useState } from 'react'
import { Input } from 'antd';

const { Search } = Input;

function SearchFeature(props) {

    const [SearchTerm, setSearchTerm] = useState("")

    const searchHandler = (event) => {
        setSearchTerm(event.currentTarget.value)
        props.refreshFunction(event.currentTarget.value) // LandingPage.js에서 구현, 부모컴포넌트인 LandingPage.js에 전달하기 위한 코드
    }

    return (
        <div>
            <Search
                placeholder="input search text"
                onChange={searchHandler}
                style={{ width: 200 }}
                value={SearchTerm} // 검색창에 입력을 할 때마다 SearchTerm의 값이 달라짐
            />
        </div>
    )
}

export default SearchFeature