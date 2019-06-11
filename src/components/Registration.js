import React from 'react';
import {Link, Redirect} from 'react-router-dom'
const SHA256 = require("crypto-js/sha256");

class Registration extends React.Component {
    constructor(props) {
        super(props);
        this.updateState = this.updateState.bind(this);
        this.submit = this.submit.bind(this);
        this.state = {
            email: "",
            password: "",
            password_again: "",
            name: "",
            isEmailExist: false,
            isEmptyFields: false,
            isPasswordsMatch: true,
            isSuccess: false
        };
    }
    updateState(event) {
        this.setState({[event.target.name]: event.target.value});
    }
    submit(event) {
        let isValid = true;
        let state = {
            isPasswordMatch: true,
            isEmptyFileds: false,
            isEmailExist: false
        };
        if (this.state.password !== this.state.password_again) {
            state.isPasswordsMatch = false;
            isValid = false;
        } 
        if (this.state.name === "" || this.state.password === "" || this.state.email === "") {
            state.isEmptyFields = true;
            isValid = false;
        }  
        fetch(`/registration?email=${this.state.email}`, {method: 'GET'}).then((res) => {
            res.json().then((accountSearch) => {        
                if (accountSearch.found) {
                    state.isEmailExist = true;
                    isValid = false;
                }
                if (isValid) {
                    let passwordHash = SHA256(this.state.password).toString()
                    let newAccount = {
                        email: this.state.email,
                        password: passwordHash,
                        name: this.state.name,
                    }
                    fetch(`/registration`, {method: 'POST', body: JSON.stringify({
                        query: "Creating new account",
                        account: newAccount
                    })}).then(() => {
                        alert("Registration complited");
                        this.setState({"isSuccess": true});
                    });
                }
                this.setState(state);
            }).catch((err) => {
                throw err;
            })
        });
    }
    checkEmail() {
        if (this.state.isEmailExist) {
            return <span className="emailExistTitle errorTitle">This email is already used</span>
        }
    }
    checkPasswords() {
        if (this.state.isPasswordsMatch === false) {
            return <span className='differentPasswordsTitle errorTitle'>Passwords are different</span>
        }
    }
    checkEmptyFields() {
        if (this.state.isEmptyFields) {
            return (<span className='emptyFieldsTitle errorTitle'><br/>All fields should be filled</span>);
        }
    }

    render() {
        return (
            <div id="login_main">
                <span className="title">Email</span><input name="email" onChange={this.updateState}/>{this.checkEmail()}<br/>
                <span className="title">Password</span><input name="password" type="password" onChange={this.updateState}/>{this.checkPasswords()}<br/>
                <span className="title">Password Again</span><input name="password_again" type="password" onChange={this.updateState}/><br/>
                <span className="title">Name</span><input name="name" onChange={this.updateState}/>
                {this.checkEmptyFields()}<br/>
                <button onClick={this.submit}>Register</button><br/>
                {(this.state.isSuccess) ? <Redirect to='/login'/> : null}
                <span><Link to="/login">Sign in</Link></span>
            </div>
        )
    }
}

export default Registration