import { useState } from "react"
import { LoginRequest, RegisterRequest } from "../types/auth";
import { loginUser, registerUser, changePassword as changePasswordRequest, ChangePasswordRequest } from "../api/authService";
import { useAuthContext } from "../context/AuthContext";
import { storeTokens } from "../api/client";
import { getOrCreateDeviceId, getReadableDeviceName } from "../utils/deviceId";

export const useAuth = () =>{
    const [loading, setloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {setToken} = useAuthContext();

    const login = async (credential : LoginRequest) => {
        setloading(true);
        setError(null);
        try{
            const deviceId = await getOrCreateDeviceId();
            const deviceName = getReadableDeviceName();
            const data = await loginUser({ ...credential, deviceId, deviceName });
            if (data.access_token) {
                await storeTokens(data.access_token, data.refresh_token);
                setToken(data.access_token);
            }

            console.log('Giriş başarılı: ', data);
        }catch(error){
            const message = error instanceof Error ? error.message : 'Giriş başarısız, lütfen bilgileri kontrol ediniz.';
            setError(message);
            console.log(error);

            setToken(null);
        }finally{
            setloading(false);
        }
    };
    const register = async (userData :RegisterRequest) => {
        setloading(true);
        setError(null);
        try {
            await registerUser(userData);
            console.log('Kayıt başarılı');
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Kayıt işlemi sırasında hata oluştu.';
            setError(message);
            console.log(error);
            return false;
        }finally{
            setloading(false);
        }
    }

    const changePassword = async (data: ChangePasswordRequest) => {
        setloading(true);
        setError(null);
        try {
            await changePasswordRequest(data);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Şifre değiştirilirken bir hata oluştu.';
            setError(message);
            return false;
        } finally {
            setloading(false);
        }
    }

    return { login, register, changePassword, loading, error};
}
