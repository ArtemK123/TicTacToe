import React from 'react'
import "../css/Admin.css"
import {Link} from 'react-router-dom'

class Admin extends React.Component {
    constructor(...props) {
        super(props)
    }
    render() {
        return (
        <div id="admin_main">
            <header>
                <h3>Адмін панель</h3>
                <nav>
                    <ul>
                        <li><Link to="/">До гри</Link></li>
                    </ul>
                </nav>
            </header>
            <div className="admin_controls">
                <button className="feedback_button">Записи зворотнього зв'язку</button>
                <button className="game_button">Backlog гри</button>
            </div>
            <div className="records">
                {/*content from database*/}
            </div>
            <footer>
                <p>Copyright 2019 - All rights are reserved</p>
            </footer>
        </div>)
    }
}

export default Admin