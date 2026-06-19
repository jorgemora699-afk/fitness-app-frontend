import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function TrainerTemplateScreen({ navigation }) {
  const { user, logout } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await client.get(
        ENDPOINTS.GET_TEMPLATES
      );

      setTemplates(
        response.data.templates || []
      );
    } catch (error) {
      console.log(
        'Error loading templates:',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const deleteTemplate = (template) => {
    Alert.alert(
      'Eliminar plantilla',
      `¿Deseas eliminar "${template.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(
                ENDPOINTS.DELETE_TEMPLATE(
                  template.id
                )
              );

              loadTemplates();

              Alert.alert(
                'Éxito',
                'Plantilla eliminada'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'No se pudo eliminar la plantilla'
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.silver}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.dark}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Plantillas
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('TrainerProfile')}
          style={styles.profileButton}
        >
          {user?.profile_photo ? (
            <Image
              source={{
                uri: `${user.profile_photo}?t=${Date.now()}`
              }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={38}
              color={COLORS.silver}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.silver}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons
              name="albums-outline"
              size={30}
              color={COLORS.silver}
            />

            <Text style={styles.statNumber}>
              {templates.length}
            </Text>

            <Text style={styles.statLabel}>
              Plantillas
            </Text>
          </View>
        </View>

        {/* Lista */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mis Plantillas
          </Text>

          {templates.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="document-outline"
                size={50}
                color={COLORS.textSecondary}
              />

              <Text style={styles.emptyTitle}>
                No tienes plantillas
              </Text>

              <Text style={styles.emptyText}>
                Crea tu primera plantilla para
                reutilizar rutinas fácilmente.
              </Text>
            </View>
          ) : (
            templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() =>
                  navigation.navigate(
                    'TemplateDetail',
                    {
                      templateId:
                        template.id
                    }
                  )
                }
              >
                <View style={styles.templateHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.templateName}
                    >
                      {template.name}
                    </Text>

                    <Text
                      style={
                        styles.templateDescription
                      }
                    >
                      {template.description ||
                        'Sin descripción'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={
                      COLORS.textSecondary
                    }
                  />
                </View>

                <View style={styles.templateFooter}>
                  <View
                    style={
                      styles.exerciseBadge
                    }
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={14}
                      color={COLORS.silver}
                    />

                    <Text
                      style={
                        styles.exerciseText
                      }
                    >
                      {
                        template.exercises
                          ?.length
                      }{' '}
                      ejercicios
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.actionsRow}
                >
                  <TouchableOpacity
                    style={
                      styles.actionButton
                    }
                    onPress={() =>
                      navigation.navigate(
                        'AssignTemplate',
                        {
                          template
                        }
                      )
                    }
                  >
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={COLORS.silver}
                    />

                    <Text
                      style={
                        styles.actionText
                      }
                    >
                      Asignar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.actionButton
                    }
                    onPress={() =>
                      deleteTemplate(
                        template
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.danger}
                    />

                    <Text
                      style={[
                        styles.actionText,
                        {
                          color:
                            COLORS.danger
                        }
                      ]}
                    >
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CreateTemplate')}
      >
        <Ionicons
          name="add"
          size={30}
          color={COLORS.dark}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20
  },

  backButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },

  addButton: {
    backgroundColor: COLORS.silver,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },

  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 20,

    width: 60,
    height: 60,
    borderRadius: 30,

    backgroundColor: COLORS.silver,

    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },

  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20
  },

  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },

  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8
  },

  statLabel: {
    color: COLORS.textSecondary,
    marginTop: 4
  },

  section: {
    paddingHorizontal: 20
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },

  templateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  templateName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text
  },

  templateDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 5
  },

  templateFooter: {
    marginTop: 15
  },

  exerciseBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },

  exerciseText: {
    color: COLORS.silver,
    marginLeft: 5,
    fontSize: 12
  },

  actionsRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10
  },

  actionButton: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },

  actionText: {
    marginTop: 4,
    color: COLORS.silver,
    fontSize: 12
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },

  profileButton: {
    borderRadius: 20,
  },

  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.silver,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },

  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8
  }
});