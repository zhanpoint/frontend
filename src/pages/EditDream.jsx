import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDreams } from '@/hooks/useDreams';
import CreatePost from './CreatePost';

const EditDream = () => {
    const { dreamId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { getDreamById, isLoading: dreamsLoading } = useDreams();
    const [dream, setDream] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 检查认证并获取梦境数据
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login', { state: { from: `/edit-dream/${dreamId}` } });
                return;
            }

            const dreamData = getDreamById(dreamId);
            if (dreamData) {
                setDream(dreamData);
            } else {
                // 如果在上下文中找不到梦境，导航到404或我的梦境列表
                navigate('/my-dreams', {
                    state: {
                        notification: {
                            type: 'error',
                            message: '找不到要编辑的梦境'
                        }
                    }
                });
            }
            setIsLoading(false);
        }
    }, [isAuthenticated, authLoading, dreamId, getDreamById, navigate]);

    if (isLoading || authLoading || dreamsLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            {dream && (
                <CreatePost
                    isEditMode={true}
                    existingDream={dream}
                />
            )}
        </div>
    );
};

export default EditDream; 