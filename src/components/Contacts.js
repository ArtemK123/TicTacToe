import React from 'react'
import '../css/Contacts.css'
import {Link} from "react-router-dom"

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.sendForm = this.sendForm.bind(this);
        this.updateState = this.updateState.bind(this);
        this.state = {
            name: "",
            org: "",
            type: "Пресса",
            body: "",
            file: undefined,
            success: null
        }
    }

    updateState(event) {
        if (event.target.name === "file") {
            this.setState({"file": event.target.files[0]});
        }
        else {
            this.setState({[event.target.name]: event.target.value});
        }
    }

    sendForm(event) {
        event.preventDefault();
        var form = new FormData();
        for (let key in this.state) {
            if (["name", "org", "type", "body"].indexOf(key) !== -1) {
                form.append(key, this.state[key]);
                this.setState({key: ""})
            }
            else if (key === "file") {
                form.append(key, this.state[key]);
                this.setState({key: undefined});
            }
        }
        console.log(form);
        fetch("/contacts", {
            method: "POST",
            contentType: "multipart/form-data",
            body: form
        }).then((res) => {
            if (res.status === 200) {
                this.setState({"success" : true});
            }
            else if (res.status === 400) {  
                this.setState({"success" : false});
            }
        });
    }

    addSuccessSign() {
        if (this.state.success === true) {
            return <span className="submited">{"\u2714"}</span>;
        }
        else if (this.state.success === false) {
            return (<span className="rejected">{"\u2718"}</span>);
        }
    }
    render() {
        return(
            <div className="feedback_form">
                <legend>Зворотній зв'язок</legend>
                <p className="form_name"><span>Ім'я</span><input name="name" onChange={this.updateState} value={this.state.name}/></p>
                <p className="form_organisation"><span>Організація</span><input name="org" onChange={this.updateState} value={this.state.org}/></p>
                <p className="form_select"><span>Тип звернення</span>
                    <select name="type" onChange={this.updateState} value={this.state.type}>
                        <option>Преса</option>
                        <option>Партнерство</option>
                        <option>Інше</option>
                    </select>
                </p>
                <p className="form_text"><span>Текст повідомлення</span></p>
                <p className="form_text_body"><textarea name="body" onChange={this.updateState} value={this.state.body}></textarea></p>
                <p className="form_addition"><span>Надіслати додаткове зображенння</span>
                <input type="file" name="file" onChange={this.updateState}/></p>		
                <p className="form_submit"><button id="form_button" onClick={this.sendForm}>Відправити</button>
                {this.addSuccessSign()}
                </p>
            </div>)
    }
}

class Contacts extends React.Component {
    render() {
        return(
            <div id='contacts_main'>
            <header>
                <h3>Контакти</h3>
                <nav>
                    <ul>
                        <li><Link to="/">Гра</Link></li>
                        <li><Link to="/about">Про гру</Link></li>
                    </ul>
                </nav>
            </header>
            <p className="info">Проект розробив студент Київського політехнічного інституту, групи ІТ-74 - Кучма Артем</p>
            <div className="contacts_container">
                <p className="number_title">Контактний номер</p>
                <p className="email_title">Електронна пошта</p>
                <p className="number_value">+380971234567</p>
                <p className="email_value">abc@gmail.com</p>		
            </div>
                <Form/>
            <footer>
                <p>Copyright 2019 - All rights are reserved</p>
            </footer>
        </div>)
    }
}

export default Contacts
