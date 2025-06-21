import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(){
        return NextResponse.next()
    },
    {
        callbacks:{
            authorized:({token,req}) =>{
                const {pathname} = req.nextUrl;

                if(
                    pathname.startsWith("api/autj") ||
                    pathname ==="/login" ||
                    pathname ==="/register"
                ){
             return true
                }

                //public 
                if(pathname === "/"){
                    return true;
                }
                return !!token

            }

        }
    }
)

export const config = {
    matcher:[]
}