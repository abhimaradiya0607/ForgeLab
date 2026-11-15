import React from 'react'
import {useNavigate,useRoutes} from 'react-router-dom'

import Dashboard from './components/dashboard/Dashboard'
import Profile from './components/user/Profile'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import RepoPage from "@/pages/RepoPage";

import { useAuth } from './authContext'
import { useEffect } from 'react'
import SocialCallback from './components/auth/SocialCallback'
import DocsLayout from './components/docs/DocsLayout'

const ProjectRoutes = () => {

  const {currentUser,setCurrentUser}=useAuth();

  const navigate=useNavigate();

  useEffect(()=>{
    const userIdFromStorage=localStorage.getItem("userId");

    if(userIdFromStorage && !currentUser){
        setCurrentUser(userIdFromStorage);
    }

    if(!userIdFromStorage && !["/auth","/signup","/social-callback"].includes(window.location.pathname)){
        navigate("/auth");
    }

    if(userIdFromStorage && window.location.pathname=='/auth'){
        navigate('/');
    }
  },[currentUser,navigate,setCurrentUser]);

  let element =useRoutes([
    {
        path:'/',
        element:<Dashboard/>
    },
    {
        path:'/auth',
        element:<Login/>
    },
    {
        path:'/signup',
        element:<Signup/>
    },
    {
        path:'/social-callback',
        element:<SocialCallback/>
    },
    {
        path:'/profile',
        element:<Profile/>
    },{
        path:'/repo/:id',
        element:<RepoPage />
    },{
        path:'/docs',
        element:<DocsLayout/>
    }
    
  ]);

  return element;
}

export default ProjectRoutes;