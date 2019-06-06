import React from 'react'

class Header extends React.Component {

    render() {
        return (
        <header>
            <h3>props.title</h3>
                <nav>
                    <ul>
                        <li><a href="./about.html">Про гру</a></li>
                        <li><a href="./contacts.html">Контакти</a></li>
                    </ul>
                </nav>
        </header>)
    }
}