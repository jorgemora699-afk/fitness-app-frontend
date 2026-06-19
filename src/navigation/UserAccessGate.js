import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import client from '../api/client';
import { ENDPOINTS, COLORS } from '../utils/constants';
import MembershipBlockedScreen from '../screens/user/MembershipBlockedScreen';
import UserNavigator from './UserNavigator';

export default function UserAccessGate() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState(null);

  const checkMembership = useCallback(async () => {
    try {
      const response = await client.get(ENDPOINTS.ACTIVE_MEMBERSHIP);
      if (response.data.membership) {
        setHasAccess(true);
        setMembershipInfo(null);
      } else {
        setHasAccess(false);
        setMembershipInfo(response.data);
      }
    } catch (error) {
      setHasAccess(false);
      setMembershipInfo(error.response?.data || { error: 'No hay membresía activa' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.silver} />
      </View>
    );
  }

  if (!hasAccess) {
    return <MembershipBlockedScreen membershipInfo={membershipInfo} onRetry={checkMembership} />;
  }

  return <UserNavigator />;
}