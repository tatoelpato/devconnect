import React, { Fragment } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/layouts/Navbar';
import Landing from './components/layouts/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import './App.css';

const App = () => (
  <Router>
    <Fragment>
      <Navbar />
      <Routes>
        <Route exact path='/' element={<Landing />} />
      </Routes>
      <section className='container'>
        <Routes>
          <Route exact path='/register' element={<Register />} />
          <Route exact path='/login' element={<Login />} />
        </Routes>
      </section>
    </Fragment>
  </Router>
);

export default App;
