import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  FlatList 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

const AdminMenuManagementScreen = ({ navigation }) => {
  const { 
    user, 
    logout, 
    fetchDailyMenuForDate, 
    addOrUpdateDailyMenu, 
    deleteDailyMenuOverride 
  } = useAuth();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateView, setShowDateView] = useState(false);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Modal state for meal editing
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [editingDishes, setEditingDishes] = useState([]);
  const [newDishInput, setNewDishInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Date selection handler
  const handleDateSelect = async (day) => {
    setSelectedDate(day.dateString);
    setShowDateView(true);
    await loadMenuForDate(day.dateString);
  };

  // Load menu data for selected date
  const loadMenuForDate = async (date) => {
    setLoading(true);
    try {
      const result = await fetchDailyMenuForDate(date);
      if (result.success) {
        setMenuData(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load menu data');
        setMenuData(null);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu data');
      setMenuData(null);
    } finally {
      setLoading(false);
    }
  };

  // Back to calendar handler
  const handleBackToCalendar = () => {
    setShowDateView(false);
    setSelectedDate(null);
    setMenuData(null);
  };

  // Edit meal handler
  const handleEditMeal = (mealType) => {
    const currentData = menuData?.dailyOverrides?.[mealType] || 
                       { dishes: menuData?.defaultMenu?.[mealType] || [] };
    
    setSelectedMealType(mealType);
    setEditingDishes([...currentData.dishes]);
    setNewDishInput('');
    setModalVisible(true);
  };

  // Add dish to editing list
  const addDish = () => {
    if (newDishInput.trim()) {
      setEditingDishes([...editingDishes, newDishInput.trim()]);
      setNewDishInput('');
    }
  };

  // Remove dish from editing list
  const removeDish = (index) => {
    const updatedDishes = editingDishes.filter((_, i) => i !== index);
    setEditingDishes(updatedDishes);
  };

  // Save meal changes
  const saveMealChanges = async () => {
    if (editingDishes.length === 0) {
      Alert.alert('Error', 'Please add at least one dish');
      return;
    }

    setSaving(true);
    try {
      const result = await addOrUpdateDailyMenu(selectedDate, selectedMealType, editingDishes);
      if (result.success) {
        Alert.alert('Success', `${selectedMealType} menu saved successfully`);
        setModalVisible(false);
        // Reload menu data
        await loadMenuForDate(selectedDate);
      } else {
        Alert.alert('Error', result.message || 'Failed to save menu');
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      Alert.alert('Error', 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default menu
  const resetToDefaultMenu = async (mealType) => {
    Alert.alert(
      'Reset to Default',
      `Are you sure you want to reset ${mealType} to the default menu? This will remove any custom override for this date.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteDailyMenuOverride(selectedDate, mealType);
              if (result.success) {
                Alert.alert('Success', `${mealType} reset to default menu`);
                await loadMenuForDate(selectedDate);
              } else {
                Alert.alert('Error', result.message || 'Failed to reset menu');
              }
            } catch (error) {
              console.error('Error resetting menu:', error);
              Alert.alert('Error', 'Failed to reset menu');
            }
          }
        }
      ]
    );
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  // Render meal section
  const renderMealSection = (mealType) => {
    const hasOverride = menuData?.dailyOverrides?.[mealType];
    const dishes = hasOverride 
      ? menuData.dailyOverrides[mealType].dishes 
      : menuData?.defaultMenu?.[mealType] || [];

    return (
      <View style={styles.mealSection} key={mealType}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{mealType}</Text>
            {hasOverride && <Text style={styles.overrideLabel}>CUSTOM</Text>}
            {!hasOverride && <Text style={styles.defaultLabel}>DEFAULT</Text>}
          </View>
          <View style={styles.mealActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditMeal(mealType)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            {hasOverride && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => resetToDefaultMenu(mealType)}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.dishesContainer}>
          {dishes.map((dish, index) => (
            <Text key={index} style={styles.dishText}>• {dish}</Text>
          ))}
        </View>
      </View>
    );
  };

  // Calendar View
  const renderCalendarView = () => (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.subtitle}>Select a date to manage menu</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <Calendar
        onDayPress={handleDateSelect}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          arrowColor: '#2196F3',
          monthTextColor: '#2d4150',
          indicatorColor: '#2196F3',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
        style={styles.calendar}
      />
    </View>
  );

  // Date Detail View
  const renderDateDetailView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToCalendar}>
            <Text style={styles.backButtonText}>← Back to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Menu for {selectedDate}</Text>
        <Text style={styles.subtitle}>
          {menuData?.dayOfWeek} • {menuData?.hasOverrides ? 'Has Custom Menu' : 'Using Default Menu'}
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <ScrollView style={styles.mealsContainer}>
          {['Breakfast', 'Lunch', 'Dinner'].map(mealType => 
            renderMealSection(mealType)
          )}
        </ScrollView>
      )}
    </View>
  );

  // Editing Modal
  const renderEditingModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit {selectedMealType}</Text>
          <Text style={styles.modalSubtitle}>{selectedDate}</Text>
        </View>
        
        <View style={styles.dishInputContainer}>
          <TextInput
            style={styles.dishInput}
            placeholder="Add new dish..."
            value={newDishInput}
            onChangeText={setNewDishInput}
            onSubmitEditing={addDish}
          />
          <TouchableOpacity style={styles.addButton} onPress={addDish}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={editingDishes}
          style={styles.dishesList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.dishItem}>
              <Text style={styles.dishItemText}>{item}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeDish(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveMealChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {showDateView ? renderDateDetailView() : renderCalendarView()}
      {renderEditingModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendar: {
    marginTop: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  mealsContainer: {
    flex: 1,
  },
  mealSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  overrideLabel: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultLabel: {
    backgroundColor: '#9E9E9E',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dishesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  dishText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  modalHeader: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  dishInputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  dishInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dishesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dishItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
  },
  cancelButton: {
    flex: 0.4,
    backgroundColor: '#9E9E9E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 0.4,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminMenuManagementScreen;
