import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../services';
import { useAuth } from '../../context/Authcontext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [loginUser, { isLoading }] = useLoginMutation();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [formError, setFormError] = useState('');

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setFormError('Email and password are required.');
            return;
        }

        try {
            const response = await loginUser(formData).unwrap();
            const token = response?.data?.token;
            const user = response?.data?.user;

            if (!token) {
                setFormError('Login failed. Please try again.');
                return;
            }

            login({ token, user });
            navigate('/dashboard', { replace: true });
        } catch (error) {
            if (error?.status === 'FETCH_ERROR') {
                setFormError('Cannot connect to server. Please make sure backend is running.');
                return;
            }
            setFormError(error?.data?.error || error?.data?.message || 'Unable to login right now.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-md">
                <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">Welcome Back</h1>
                <p className="mb-6 text-center text-sm text-slate-600">Sign in to continue your learning.</p>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={onChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={onChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </div>

                    {formError && (
                        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-slate-800 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    New here?{' '}
                    <Link to="/register" className="font-semibold text-slate-800 hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;