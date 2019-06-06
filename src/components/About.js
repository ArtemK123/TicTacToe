import React from 'react'
import "../css/About.css"
import {Link} from 'react-router-dom'
import video from '../media/about_video.webm'

class About extends React.Component {
    render() {
        return ( 
            <div id="about_main">
                <header>
                <h3>Про гру хрестики-нулики</h3>
                    <nav>
                        <ul>
                            <li><Link to='/'>Гра</Link></li>
                            <li><Link to="/contacts">Контакти</Link></li>
                        </ul>
                    </nav>
                </header>
                <div className="info">
                    <p className="info_text">
                        Хрестики-нулики - класична гра, в яку, певно, грав кожен.
                        Суть гри - скласти три однакові фігури в ряд - хто склав, той переміг.
                        Розмір поля може бути різними - у даному випадку гра ведеться на полі 5 на 5.
                        Першими зазвичай починають хрестики. Нехай щастить у грі!
                    </p>
                    <video className="info_video" src ={video} controls="controls"></video>
                </div>
                <footer>
                    <p>Copyright 2019 - All rights are reserved</p>
                </footer>
            </div>
        )
    }
}

export default About