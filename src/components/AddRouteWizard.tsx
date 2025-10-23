'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check, User, Calendar, MapPin, Users, RefreshCw } from 'lucide-react'

interface RouteData {
  // Basic Information
  name: string
  code: string
  role_uid: string
  job_position_uid: string
  org_uid: string
  principal_uid: string
  status: string
  valid_from: string
  valid_upto: string
  
  // Assignment
  assignment_role_uid: string
  primary_employee_uid: string
  
  // Optional Details
  warehouse_uid: string
  vehicle_type: string
  
  // Additional Database Fields
  wh_org_uid?: string
  vehicle_uid?: string
  location_uid?: string
  print_standing?: boolean
  print_topup?: boolean
  print_order_summary?: boolean
  auto_freeze_jp?: boolean
  add_to_run?: boolean
  ss?: number
  total_customers?: number
  print_forward?: boolean
  
  // Customers
  customers: Array<{
    id: string
    name: string
    address: string
    contact: string
    visit_time: string
    frequency?: string
  }>
  
  // Schedule
  visit_duration: number
  travel_time: number
  visit_time: string
  end_time: string
  auto_freeze_run_time: string
  is_customer_with_time: boolean
}

const steps = [
  { id: 1, name: 'Basic Information', icon: User },
  { id: 2, name: 'Customers', icon: Users },
  { id: 3, name: 'Schedule', icon: Calendar },
  { id: 4, name: 'Review', icon: Check },
]

export default function AddRouteWizard({ isOpen, onClose, onSuccess }: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [principals, setPrincipals] = useState<Array<{uid: string, name: string}>>([])
  const [roles, setRoles] = useState<Array<{uid: string, name: string}>>([])
  const [employees, setEmployees] = useState<Array<{uid: string, name: string}>>([])
  const [warehouses, setWarehouses] = useState<Array<{uid: string, name: string}>>([])
  const [stores, setStores] = useState<Array<{uid: string, name: string, alias_name: string, legal_name: string, type: string, status: string, city_uid: string, state_uid: string, country_uid: string}>>([])
  const [loadingPrincipals, setLoadingPrincipals] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [loadingStores, setLoadingStores] = useState(false)
  const [jobPositions, setJobPositions] = useState<Array<{uid: string, designation: string, department: string}>>([])
  const [loadingJobPositions, setLoadingJobPositions] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectionMode] = useState<'multiple'>('multiple')
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<string>('daily')
  const [selectedWeek, setSelectedWeek] = useState<string>('Week 1')
  const [selectedDay, setSelectedDay] = useState<string>('Mon')
  const [selectedMonthDay, setSelectedMonthDay] = useState<string>('1')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [scheduledCustomers, setScheduledCustomers] = useState<Array<{
    id: string
    name: string
    code: string
    frequency: string
    week?: string
    day?: string
    monthDay?: string
  }>>([])
  const [selectedCustomersForSchedule, setSelectedCustomersForSchedule] = useState<string[]>([])
  const [routeData, setRouteData] = useState<RouteData>({
    name: '',
    code: '',
    role_uid: '',
    job_position_uid: '',
    org_uid: 'EPIC01',
    principal_uid: '',
    status: 'Active',
    valid_from: '',
    valid_upto: '',
    assignment_role_uid: '',
    primary_employee_uid: '',
    warehouse_uid: '',
    vehicle_type: '',
    // Additional Database Fields
    wh_org_uid: '',
    vehicle_uid: '',
    location_uid: '',
    print_standing: false,
    print_topup: false,
    print_order_summary: false,
    auto_freeze_jp: false,
    add_to_run: false,
    ss: 0,
    total_customers: 0,
    print_forward: false,
    customers: [],
    visit_duration: 30,
    travel_time: 15,
    visit_time: '',
    end_time: '',
    auto_freeze_run_time: '',
    is_customer_with_time: false,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPrincipals()
      fetchRoles()
      fetchEmployees()
      fetchWarehouses()
      fetchJobPositions()
    }
  }, [isOpen])

  // Fetch all stores when entering customers step
  useEffect(() => {
    if (currentStep === 2) {
      fetchStores()
    }
  }, [currentStep])

  // Auto-add selected customers when time slots change (for non-daily frequencies)
  useEffect(() => {
    if (selectedCustomersForSchedule.length > 0 && selectedFrequency && selectedFrequency !== 'daily') {
      const customersToSchedule = routeData.customers.filter(customer => 
        selectedCustomersForSchedule.includes(customer.id)
      )
      
      const scheduleData = customersToSchedule.map(customer => ({
        id: customer.id,
        name: customer.name,
        code: customer.id.split('_')[1],
        frequency: selectedFrequency,
        week: selectedFrequency === 'weekly' || selectedFrequency === 'multiple' ? selectedWeek : undefined,
        day: selectedFrequency === 'weekly' || selectedFrequency === 'multiple' ? selectedDay : undefined,
        monthDay: selectedFrequency === 'monthly' ? selectedMonthDay : undefined
      }))
      
      // Check if these customers are already scheduled
      const newSchedules = scheduleData.filter(newSchedule => 
        !scheduledCustomers.some(existing => 
          existing.id === newSchedule.id && 
          existing.frequency === newSchedule.frequency &&
          existing.week === newSchedule.week &&
          existing.day === newSchedule.day &&
          existing.monthDay === newSchedule.monthDay
        )
      )
      
      if (newSchedules.length > 0) {
        setScheduledCustomers(prev => [...prev, ...newSchedules])
      }
    }
  }, [selectedWeek, selectedDay, selectedMonthDay])

  // Load customers from localStorage when Schedule section is displayed
  useEffect(() => {
    if (currentStep === 3) {
      console.log('Schedule section displayed - loading customers from localStorage')
      const savedCustomers = localStorage.getItem('routeCustomers')
      if (savedCustomers) {
        try {
          const customers = JSON.parse(savedCustomers)
          console.log('Schedule section - loaded customers:', customers)
          setRouteData(prev => ({ ...prev, customers }))
        } catch (error) {
          console.error('Error loading customers in Schedule section:', error)
        }
      } else {
        console.log('No customers found in localStorage for Schedule section')
      }
    }
  }, [currentStep])





  // Get customers to display based on frequency using localStorage
  const getCustomersToDisplay = () => {
    console.log('=== DISPLAYING CUSTOMERS ===')
    
    // Get customers from localStorage
    const savedCustomers = localStorage.getItem('routeCustomers')
    console.log('getCustomersToDisplay - raw localStorage:', savedCustomers)
    
    if (!savedCustomers) {
      console.log('No customers found in localStorage')
      return []
    }
    
    let customers = []
    try {
      customers = JSON.parse(savedCustomers)
      console.log('getCustomersToDisplay - parsed customers:', customers)
    } catch (error) {
      console.error('Error parsing customers from localStorage:', error)
      return []
    }
    
    if (!Array.isArray(customers)) {
      console.log('Customers is not an array:', customers)
      return []
    }
    
    console.log('getCustomersToDisplay - customers count:', customers.length)
    console.log('getCustomersToDisplay - selectedFrequency:', selectedFrequency)
    
    // Always show all customers from localStorage
    const displayCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      code: customer.id.split('_')[1] || customer.id,
      frequency: customer.frequency || 'daily',
      week: undefined,
      day: undefined,
      monthDay: undefined
    }))
    
    console.log('getCustomersToDisplay - displayCustomers:', displayCustomers)
    console.log('=== CUSTOMERS DISPLAYED ===')
    return displayCustomers
  }

  // Fetch principals from org table
  const fetchPrincipals = async () => {
    setLoadingPrincipals(true)
    try {
      const response = await fetch('/api/principals')
      if (response.ok) {
        const data = await response.json()
        setPrincipals(data)
      }
    } catch (error) {
      console.error('Error fetching principals:', error)
    } finally {
      setLoadingPrincipals(false)
    }
  }

  // Fetch roles from roles table
  const fetchRoles = async () => {
    setLoadingRoles(true)
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  // Fetch employees from emp table
  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Fetch warehouses from org table
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true)
    try {
      const response = await fetch('/api/warehouses')
      if (response.ok) {
        const data = await response.json()
        setWarehouses(data)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    } finally {
      setLoadingWarehouses(false)
    }
  }

  const fetchJobPositions = async () => {
    setLoadingJobPositions(true)
    try {
      const response = await fetch('/api/job-positions')
      if (response.ok) {
        const data = await response.json()
        setJobPositions(data)
      }
    } catch (error) {
      console.error('Error fetching job positions:', error)
    } finally {
      setLoadingJobPositions(false)
    }
  }

  // Fetch stores for customer search
  const fetchStores = async (searchTerm: string = '') => {
    console.log('Fetching stores with search term:', searchTerm)
    setLoadingStores(true)
    try {
      const url = searchTerm ? `/api/stores?search=${encodeURIComponent(searchTerm)}` : '/api/stores'
      console.log('Fetching from URL:', url)
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched stores data:', data)
        setStores(data)
      } else {
        console.error('Failed to fetch stores:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoadingStores(false)
    }
  }

  const generateRouteCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 3).toUpperCase()
    const rolePrefix = routeData.role_uid ? routeData.role_uid.substring(0, 3).toUpperCase() : 'RT'
    const generatedCode = `${rolePrefix}${timestamp}${random}`
    setRouteData({ ...routeData, code: generatedCode })
  }

  // Handle store selection
  const handleStoreSelection = (storeUid: string) => {
    console.log('Store selection - storeUid:', storeUid)
    setSelectedStores(prev => {
      const newSelection = prev.includes(storeUid) 
        ? prev.filter(uid => uid !== storeUid)
        : [...prev, storeUid]
      console.log('Store selection - newSelection:', newSelection)
      return newSelection
    })
  }

  // Handle select all stores
  const handleSelectAllStores = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([])
    } else {
      setSelectedStores(stores.map(store => store.uid))
    }
  }

  // Handle frequency selection
  const handleFrequencySelection = (frequency: string) => {
    setSelectedFrequency(frequency)
  }

  // Handle week selection
  const handleWeekSelection = (week: string) => {
    setSelectedWeek(week)
  }

  // Handle day selection
  const handleDaySelection = (day: string) => {
    setSelectedDay(day)
  }

  // Handle month day selection
  const handleMonthDaySelection = (day: string) => {
    setSelectedMonthDay(day)
  }

  // Toggle customer dropdown
  const toggleCustomerDropdown = () => {
    setShowCustomerDropdown(!showCustomerDropdown)
  }

  // Handle customer selection for scheduling
  const handleCustomerSelection = (customerId: string) => {
    setSelectedCustomersForSchedule(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId)
      } else {
        return [...prev, customerId]
      }
    })
  }

  // Check if customer is selected for scheduling
  const isCustomerSelected = (customerId: string) => {
    return selectedCustomersForSchedule.includes(customerId)
  }

  // Add customer to schedule
  const addCustomerToSchedule = (customer: any) => {
    const scheduleData = {
      id: customer.id,
      name: customer.name,
      code: customer.id.split('_')[1],
      frequency: selectedFrequency,
      week: selectedFrequency === 'weekly' || selectedFrequency === 'multiple' ? selectedWeek : undefined,
      day: selectedFrequency === 'weekly' || selectedFrequency === 'multiple' ? selectedDay : undefined,
      monthDay: selectedFrequency === 'monthly' ? selectedMonthDay : undefined
    }
    
    setScheduledCustomers(prev => [...prev, scheduleData])
    setShowCustomerDropdown(false)
  }

  // Get filtered customers based on frequency
  const getFilteredCustomers = () => {
    // For now, show all customers from the Customers section
    // The frequency filtering will be handled when scheduling
    return routeData.customers
  }

  // Get scheduled customers for current selection
  const getScheduledCustomersForCurrentSelection = () => {
    if (selectedFrequency === 'daily') {
      return scheduledCustomers.filter(c => c.frequency === 'daily')
    } else if (selectedFrequency === 'weekly' || selectedFrequency === 'multiple') {
      return scheduledCustomers.filter(c => 
        c.frequency === selectedFrequency && 
        c.week === selectedWeek && 
        c.day === selectedDay
      )
    } else if (selectedFrequency === 'monthly') {
      return scheduledCustomers.filter(c => 
        c.frequency === 'monthly' && 
        c.monthDay === selectedMonthDay
      )
    } else if (selectedFrequency === 'fortnightly') {
      return scheduledCustomers.filter(c => c.frequency === 'fortnightly')
    }
    return []
  }

  // Add selected stores as customers using localStorage only
  const addSelectedStoresAsCustomers = () => {
    console.log('=== ADDING CUSTOMERS ===')
    console.log('Adding customers - selectedStores:', selectedStores)
    console.log('Adding customers - stores:', stores)
    console.log('Adding customers - selectedFrequency:', selectedFrequency)
    
    if (selectedStores.length === 0) {
      console.log('No stores selected, cannot add customers')
      return
    }
    
    const selectedStoreData = stores.filter(store => selectedStores.includes(store.uid))
    console.log('Adding customers - selectedStoreData:', selectedStoreData)
    
    if (selectedStoreData.length === 0) {
      console.log('No store data found for selected stores')
      return
    }
    
    const newCustomers = selectedStoreData.map(store => ({
      id: `store_${store.uid}_${Date.now()}`,
      name: store.name,
      address: store.alias_name || store.legal_name || '',
      contact: store.type || '',
      visit_time: '',
      frequency: selectedFrequency
    }))
    
    console.log('Adding customers - newCustomers:', newCustomers)
    
    // Get existing customers from localStorage
    const existingCustomers = localStorage.getItem('routeCustomers')
    console.log('Existing customers from localStorage:', existingCustomers)
    
    const currentCustomers = existingCustomers ? JSON.parse(existingCustomers) : []
    console.log('Parsed current customers:', currentCustomers)
    
    // Add new customers to existing ones
    const updatedCustomers = [...currentCustomers, ...newCustomers]
    console.log('Updated customers array:', updatedCustomers)
    
    // Save to localStorage only
    localStorage.setItem('routeCustomers', JSON.stringify(updatedCustomers))
    console.log('Saved to localStorage successfully')
    
    // Verify save
    const verifySave = localStorage.getItem('routeCustomers')
    console.log('Verification - localStorage after save:', verifySave)
    
    // Clear selections
    setSelectedStores([])
    setCustomerSearch('')
    setStores([])
    
    console.log('=== CUSTOMERS ADDED SUCCESSFULLY ===')
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      
      // If moving to Schedule section, force refresh customers from localStorage
      if (currentStep + 1 === 3) {
        console.log('Moving to Schedule section - refreshing customers from localStorage')
        const savedCustomers = localStorage.getItem('routeCustomers')
        if (savedCustomers) {
          try {
            const customers = JSON.parse(savedCustomers)
            console.log('Loaded customers for Schedule section:', customers)
            setRouteData(prev => ({ ...prev, customers }))
          } catch (error) {
            console.error('Error loading customers for Schedule section:', error)
          }
        } else {
          console.log('No customers found in localStorage for Schedule section')
        }
      }
    }
  }

  // Clear localStorage when wizard is completed or reset
  const clearStoredCustomers = () => {
    localStorage.removeItem('routeCustomers')
  }

  // Handle wizard close with localStorage cleanup
  const handleClose = () => {
    clearStoredCustomers()
    onClose()
  }


  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      })

       if (response.ok) {
         // Clear localStorage on successful submission
         clearStoredCustomers()
         
         // Show success popup
         alert('Route created successfully!')
         
         onSuccess()
         onClose()
        // Reset form
        setCurrentStep(1)
        setRouteData({
          name: '',
          code: '',
          role_uid: '',
          job_position_uid: '',
          org_uid: 'EPIC01',
          principal_uid: '',
          status: 'Active',
          valid_from: '',
          valid_upto: '',
          assignment_role_uid: '',
          primary_employee_uid: '',
          warehouse_uid: '',
          vehicle_type: '',
          // Additional Database Fields
          wh_org_uid: '',
          vehicle_uid: '',
          location_uid: '',
          print_standing: false,
          print_topup: false,
          print_order_summary: false,
          auto_freeze_jp: false,
          add_to_run: false,
          ss: 0,
          total_customers: 0,
          print_forward: false,
          customers: [],
          visit_duration: 30,
          travel_time: 15,
          visit_time: '',
          end_time: '',
          auto_freeze_run_time: '',
          is_customer_with_time: false,
        })
      } else {
        throw new Error('Failed to create route')
      }
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Failed to create route. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addCustomer = () => {
    setRouteData({
      ...routeData,
      customers: [
        ...routeData.customers,
        {
          id: Date.now().toString(),
          name: '',
          address: '',
          contact: '',
          visit_time: '',
        },
      ],
    })
  }

  const removeCustomer = (id: string) => {
    setRouteData({
      ...routeData,
      customers: routeData.customers.filter(customer => customer.id !== id),
    })
  }

  const updateCustomer = (id: string, field: string, value: string) => {
    setRouteData({
      ...routeData,
      customers: routeData.customers.map(customer =>
        customer.id === id ? { ...customer, [field]: value } : customer
      ),
    })
  }

  if (!isOpen) return null

  return (
    <div className=" full screen fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Route</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    value={routeData.name}
                    onChange={(e) => setRouteData({ ...routeData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter route name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={routeData.code}
                      onChange={(e) => setRouteData({ ...routeData, code: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter route code or generate one"
                    />
                    <button
                      type="button"
                      onClick={generateRouteCode}
                      className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Generate route code"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Auto
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Code will be auto-generated based on role and timestamp
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Position *
                  </label>
                  <select
                    value={routeData.job_position_uid}
                    onChange={(e) => setRouteData({ ...routeData, job_position_uid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingJobPositions}
                  >
                    <option value="">{loadingJobPositions ? 'Loading job positions...' : 'Select Job Position'}</option>
                    {jobPositions.map((position) => (
                      <option key={position.uid} value={position.uid}>
                        {position.designation} ({position.uid}) - {position.department}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal *
                  </label>
                  <select
                    value={routeData.principal_uid}
                    onChange={(e) => setRouteData({ ...routeData, principal_uid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingPrincipals}
                  >
                    <option value="">{loadingPrincipals ? 'Loading principals...' : 'Select Principal'}</option>
                    {principals.map((principal) => (
                      <option key={principal.uid} value={principal.uid}>
                        {principal.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={routeData.valid_from}
                    onChange={(e) => setRouteData({ ...routeData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Upto *
                  </label>
                  <input
                    type="date"
                    value={routeData.valid_upto}
                    onChange={(e) => setRouteData({ ...routeData, valid_upto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Assignment Section */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={routeData.assignment_role_uid}
                      onChange={(e) => setRouteData({ ...routeData, assignment_role_uid: e.target.value, role_uid: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingRoles}
                    >
                      <option value="">{loadingRoles ? 'Loading roles...' : 'Select Role'}</option>
                      {roles.map((role) => (
                        <option key={role.uid} value={role.uid}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Employee *
                    </label>
                    <select
                      value={routeData.primary_employee_uid}
                      onChange={(e) => setRouteData({ ...routeData, primary_employee_uid: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingEmployees}
                    >
                      <option value="">{loadingEmployees ? 'Loading employees...' : 'Select Primary Employee'}</option>
                      {employees.map((employee) => (
                        <option key={employee.uid} value={employee.uid}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Details Section */}
              <div className="mt-8">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <h4 className="text-lg font-semibold text-gray-900">Optional Details</h4>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Warehouse
                        </label>
                        <select
                          value={routeData.warehouse_uid}
                          onChange={(e) => setRouteData({ ...routeData, warehouse_uid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loadingWarehouses}
                        >
                          <option value="">{loadingWarehouses ? 'Loading warehouses...' : 'Select Warehouse'}</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.uid} value={warehouse.uid}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={routeData.vehicle_type}
                          onChange={(e) => setRouteData({ ...routeData, vehicle_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Vehicle Type</option>
                          <option value="truck">Truck</option>
                          <option value="container">Container</option>
                          <option value="van">Van</option>
                          <option value="car">Car</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Additional Database Fields Section */}
              <div className="mt-8">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <h4 className="text-lg font-semibold text-gray-900">Additional Settings</h4>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Warehouse Organization UID
                        </label>
                        <input
                          type="text"
                          value={routeData.wh_org_uid || ''}
                          onChange={(e) => setRouteData({ ...routeData, wh_org_uid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter warehouse org UID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle UID
                        </label>
                        <input
                          type="text"
                          value={routeData.vehicle_uid || ''}
                          onChange={(e) => setRouteData({ ...routeData, vehicle_uid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter vehicle UID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location UID
                        </label>
                        <input
                          type="text"
                          value={routeData.location_uid || ''}
                          onChange={(e) => setRouteData({ ...routeData, location_uid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter location UID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SS (Special Settings)
                        </label>
                        <input
                          type="number"
                          value={routeData.ss || 0}
                          onChange={(e) => setRouteData({ ...routeData, ss: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter special settings number"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Customers
                        </label>
                        <input
                          type="number"
                          value={routeData.total_customers || 0}
                          onChange={(e) => setRouteData({ ...routeData, total_customers: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter total customers"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Boolean Settings */}
                    <div className="mt-6">
                      <h5 className="text-md font-medium text-gray-900 mb-4">Print & System Settings</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.print_standing || false}
                            onChange={(e) => setRouteData({ ...routeData, print_standing: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Print Standing</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.print_topup || false}
                            onChange={(e) => setRouteData({ ...routeData, print_topup: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Print Topup</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.print_order_summary || false}
                            onChange={(e) => setRouteData({ ...routeData, print_order_summary: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Print Order Summary</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.auto_freeze_jp || false}
                            onChange={(e) => setRouteData({ ...routeData, auto_freeze_jp: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Auto Freeze JP</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.add_to_run || false}
                            onChange={(e) => setRouteData({ ...routeData, add_to_run: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Add to Run</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeData.print_forward || false}
                            onChange={(e) => setRouteData({ ...routeData, print_forward: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Print Forward</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Selection</h3>
                <p className="text-gray-600">Choose customers to be included in this route and select the visit frequency.</p>
              </div>

              {/* Visit Frequency Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Visit Frequency</h4>
                
                <div className="space-y-3">
                  {/* First Row */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visitFrequency"
                        value="daily"
                        checked={selectedFrequency === 'daily'}
                        onChange={(e) => handleFrequencySelection(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">Daily</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visitFrequency"
                        value="weekly"
                        checked={selectedFrequency === 'weekly'}
                        onChange={(e) => handleFrequencySelection(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">Weekly</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visitFrequency"
                        value="multiple"
                        checked={selectedFrequency === 'multiple'}
                        onChange={(e) => handleFrequencySelection(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">Multiple per Week</span>
                    </label>
                  </div>
                  
                  {/* Second Row */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visitFrequency"
                        value="monthly"
                        checked={selectedFrequency === 'monthly'}
                        onChange={(e) => handleFrequencySelection(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">Monthly</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visitFrequency"
                        value="fortnightly"
                        checked={selectedFrequency === 'fortnightly'}
                        onChange={(e) => handleFrequencySelection(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">Fortnightly</span>
                    </label>
                  </div>
                </div>
              </div>


              {/* Select Customers Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Select Customers</h4>
                    <p className="text-sm text-gray-600">Choose stores and configure individual visit schedules.</p>
                  </div>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search customers by name or ID..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={addSelectedStoresAsCustomers}
                      disabled={selectedStores.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {selectedStores.length} selected ({selectedFrequency})
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Import Excel
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Template
                    </button>
                    <button 
                      onClick={() => {
                        console.log('=== ADDING TEST CUSTOMER ===')
                        const testCustomer = {
                          id: `test_customer_${Date.now()}`,
                          name: 'Test Customer',
                          address: 'Test Address',
                          contact: 'Test Contact',
                          visit_time: '',
                          frequency: selectedFrequency
                        }
                        
                        console.log('Test customer to add:', testCustomer)
                        
                        // Get existing customers from localStorage
                        const existingCustomers = localStorage.getItem('routeCustomers')
                        console.log('Existing customers before add:', existingCustomers)
                        
                        const currentCustomers = existingCustomers ? JSON.parse(existingCustomers) : []
                        console.log('Parsed current customers:', currentCustomers)
                        
                        // Add test customer
                        const updatedCustomers = [...currentCustomers, testCustomer]
                        console.log('Updated customers array:', updatedCustomers)
                        
                        // Save to localStorage only
                        localStorage.setItem('routeCustomers', JSON.stringify(updatedCustomers))
                        console.log('Saved to localStorage')
                        
                        // Verify save
                        const verifySave = localStorage.getItem('routeCustomers')
                        console.log('Verification - localStorage after save:', verifySave)
                        
                        console.log('=== TEST CUSTOMER ADDED ===')
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Test Customer
                    </button>
                    <button 
                      onClick={() => {
                        console.log('=== ADDING SELECTED CUSTOMERS ===')
                        console.log('Selected stores:', selectedStores)
                        console.log('Available stores:', stores)
                        console.log('Selected frequency:', selectedFrequency)
                        
                        if (selectedStores.length === 0) {
                          console.log('No stores selected, cannot add customers')
                          alert('Please select some customers first!')
                          return
                        }
                        
                        // Get selected store data
                        const selectedStoreData = stores.filter(store => selectedStores.includes(store.uid))
                        console.log('Selected store data:', selectedStoreData)
                        
                        if (selectedStoreData.length === 0) {
                          console.log('No store data found for selected stores')
                          alert('No customer data found for selected stores!')
                          return
                        }
                        
                        // Create customer objects from selected stores
                        const newCustomers = selectedStoreData.map(store => ({
                          id: `store_${store.uid}_${Date.now()}`,
                          name: store.name,
                          address: store.alias_name || store.legal_name || '',
                          contact: store.type || '',
                          visit_time: '',
                          frequency: selectedFrequency
                        }))
                        
                        console.log('New customers to add:', newCustomers)
                        
                        // Get existing customers from localStorage
                        const existingCustomers = localStorage.getItem('routeCustomers')
                        console.log('Existing customers before add:', existingCustomers)
                        
                        const currentCustomers = existingCustomers ? JSON.parse(existingCustomers) : []
                        console.log('Parsed current customers:', currentCustomers)
                        
                        // Add new customers to existing ones
                        const updatedCustomers = [...currentCustomers, ...newCustomers]
                        console.log('Updated customers array:', updatedCustomers)
                        
                        // Save to localStorage
                        localStorage.setItem('routeCustomers', JSON.stringify(updatedCustomers))
                        console.log('Saved to localStorage')
                        
                        // Verify save
                        const verifySave = localStorage.getItem('routeCustomers')
                        console.log('Verification - localStorage after save:', verifySave)
                        
                        // Clear selections
                        setSelectedStores([])
                        setCustomerSearch('')
                        setStores([])
                        
                        console.log('=== SELECTED CUSTOMERS ADDED ===')
                        alert(`Successfully added ${newCustomers.length} customers to localStorage!`)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Selected Customers
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Loaded: {stores.length} / 5676 | Selected: {selectedStores.length} | Frequency: {selectedFrequency}
                  </div>
                </div>

                {/* Loading State */}
                {loadingStores && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-gray-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      Loading customers from database...
                    </div>
                  </div>
                )}

                {/* Store Results */}
                {!loadingStores && stores.length > 0 && (
                  <div className="space-y-3">
                    {/* Select All Button */}
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStores.length === stores.length && stores.length > 0}
                          onChange={handleSelectAllStores}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All Customers ({stores.length} found)
                        </span>
                      </label>
                    </div>

                    {/* Scrollable Store List */}
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                      {stores.map((store) => (
                        <div key={store.uid} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <label className="flex items-start gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStores.includes(store.uid)}
                              onChange={() => handleStoreSelection(store.uid)}
                              className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{store.name}</div>
                              <div className="text-sm text-gray-600 truncate mt-1">{store.alias_name || store.legal_name || ''}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {store.type && `Type: ${store.type}`}
                                {store.status && ` • Status: ${store.status}`}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!loadingStores && customerSearch && stores.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No customers found matching "{customerSearch}"</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Schedule Types for this Route */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Types for this Route</h3>
                  <span className="text-sm text-gray-500">1 frequency types selected</span>
                </div>
                
                {/* Frequency Card */}
                <div className="bg-blue-600 rounded-lg p-4 mb-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white text-xl font-bold">{selectedFrequency.charAt(0).toUpperCase() + selectedFrequency.slice(1)}</div>
                      <div className="text-white text-sm opacity-90">
                        {selectedFrequency === 'daily' && 'Every day'}
                        {selectedFrequency === 'weekly' && 'week'}
                        {selectedFrequency === 'multiple' && 'Multiple times per week'}
                        {selectedFrequency === 'monthly' && 'Once a month'}
                        {selectedFrequency === 'fortnightly' && 'Every two weeks'}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                </div>
                
                {/* Time Settings Button */}
                <div className="flex justify-end mb-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Settings
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Currently configuring: <span className="text-blue-600 font-medium">{selectedFrequency.charAt(0).toUpperCase() + selectedFrequency.slice(1)}</span>
                </div>
              </div>

              {/* Dynamic UI based on frequency */}
              {(selectedFrequency === 'weekly' || selectedFrequency === 'multiple' || selectedFrequency === 'monthly') && (
                <div className="space-y-6">
                  {/* Select Week - Only for weekly and multiple */}
                  {(selectedFrequency === 'weekly' || selectedFrequency === 'multiple') && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Week</h4>
                      <div className="flex gap-3">
                        {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((week) => (
                          <button
                            key={week}
                            onClick={() => handleWeekSelection(week)}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              selectedWeek === week
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {week}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select Day - Dynamic based on frequency */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Day</h4>
                    <div className="flex gap-3 flex-wrap">
                      {selectedFrequency === 'monthly' ? (
                        // Monthly: Show days 1-31
                        Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            onClick={() => handleMonthDaySelection(day.toString())}
                            className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                              selectedMonthDay === day.toString()
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))
                      ) : (
                        // Weekly/Multiple: Show days of week
                        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <button
                            key={day}
                            onClick={() => handleDaySelection(day)}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              selectedDay === day
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Customer Selection</h4>
                      <span className="text-sm text-gray-600">
                        {routeData.customers.length} available customers <span className="text-blue-600">(0 assigned to other schedules)</span>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">Add customers for {selectedFrequency.charAt(0).toUpperCase() + selectedFrequency.slice(1)} schedule</p>
                    
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Select customers to add..."
                          onClick={toggleCustomerDropdown}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 cursor-pointer"
                          readOnly
                        />
                        <svg 
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {/* Customer Dropdown */}
                      {showCustomerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {routeData.customers.length > 0 ? (
                            routeData.customers.map((customer) => (
                              <div
                                key={customer.id}
                                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                                  isCustomerSelected(customer.id) 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handleCustomerSelection(customer.id)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">Code: {customer.id.split('_')[1]}</div>
                                  <div className="text-xs text-gray-400">Frequency: {customer.frequency || 'Not set'}</div>
                                </div>
                                <div className="ml-2">
                                  {isCustomerSelected(customer.id) ? (
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No customers available. Add customers in the previous step.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {selectedFrequency === 'monthly' ? `Day ${selectedMonthDay}` : selectedWeek}
                      </span>
                      <span className="text-gray-600">
                        {selectedFrequency === 'monthly' ? 'Monthly' : selectedDay}
                      </span>
                      <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {selectedCustomersForSchedule.length} selected
                      </button>
                    </div>
                  </div>
                </div>
              )}



              {/* Status Panel */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Customer Status</h4>
                    <p className="text-sm text-gray-600">
                      {localStorage.getItem('routeCustomers') ? JSON.parse(localStorage.getItem('routeCustomers') || '[]').length : 0} customers in localStorage | 
                      {getCustomersToDisplay().length} customers to display | 
                      Frequency: {selectedFrequency}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      localStorage: {localStorage.getItem('routeCustomers') ? JSON.parse(localStorage.getItem('routeCustomers') || '[]').length : 0} items
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Raw localStorage: {localStorage.getItem('routeCustomers') ? (localStorage.getItem('routeCustomers') || '').substring(0, 100) + '...' : 'No data'}
                    </p>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        const savedCustomers = localStorage.getItem('routeCustomers')
                        if (savedCustomers) {
                          const customers = JSON.parse(savedCustomers)
                          console.log('Refreshed customers from localStorage:', customers)
                          // Force re-render by updating a dummy state
                          setRouteData(prev => ({ ...prev, customers }))
                        } else {
                          console.log('No customers found in localStorage to refresh')
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 mb-2"
                    >
                      Refresh Customers
                    </button>
                    <button
                      onClick={() => {
                        console.log('Current localStorage:', localStorage.getItem('routeCustomers'))
                        console.log('Current routeData.customers:', routeData.customers)
                        console.log('Current getCustomersToDisplay():', getCustomersToDisplay())
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 mb-2"
                    >
                      Debug Log
                    </button>
                    <button
                      onClick={() => {
                        // Clear localStorage and add test customers
                        localStorage.removeItem('routeCustomers')
                        
                        const testCustomers = [
                          {
                            id: `test_1_${Date.now()}`,
                            name: 'Test Customer 1',
                            address: 'Test Address 1',
                            contact: 'Test Contact 1',
                            visit_time: '',
                            frequency: 'daily'
                          },
                          {
                            id: `test_2_${Date.now()}`,
                            name: 'Test Customer 2',
                            address: 'Test Address 2',
                            contact: 'Test Contact 2',
                            visit_time: '',
                            frequency: 'daily'
                          }
                        ]
                        
                        localStorage.setItem('routeCustomers', JSON.stringify(testCustomers))
                        console.log('Added test customers to localStorage:', testCustomers)
                        
                        // Force re-render
                        setRouteData(prev => ({ ...prev, customers: testCustomers }))
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 mb-2"
                    >
                      Add Test Customers
                    </button>
                    <button
                      onClick={() => {
                        console.log('Current localStorage:', localStorage.getItem('routeCustomers'))
                        console.log('getCustomersToDisplay():', getCustomersToDisplay())
                        console.log('getCustomersToDisplay().length:', getCustomersToDisplay().length)
                      }}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 mb-2"
                    >
                      Check Data
                    </button>
                    <button
                      onClick={() => {
                        // Force refresh customers from localStorage
                        const savedCustomers = localStorage.getItem('routeCustomers')
                        if (savedCustomers) {
                          const customers = JSON.parse(savedCustomers)
                          setRouteData(prev => ({ ...prev, customers }))
                          console.log('Force refreshed customers:', customers)
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Force Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Show all customers for debugging */}
              {true && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customers Scheduled</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{localStorage.getItem('routeCustomers') ? JSON.parse(localStorage.getItem('routeCustomers') || '[]').length : 0} customers loaded</span>
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        Daily Schedule
                      </button>
                    </div>
                  </div>
                  
                  {getCustomersToDisplay().length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700"># / Order</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCustomersToDisplay().map((customer, index) => (
                            <tr key={customer.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                  <span className="text-gray-900 font-medium">{index + 1}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-bold text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">Code: {customer.id.split('_')[1]}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-900">NA</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900">{routeData.visit_duration || 30} min</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">normal</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button className="text-red-400 hover:text-red-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.306-.835-2.418-2-2.83M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-1.306.835-2.418 2-2.83m0 0a3 3 0 012.83 0M9 15a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p>No customers scheduled yet</p>
                      <p className="text-sm">Add customers in the previous step to see them here</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fortnightly frequency */}
              {selectedFrequency === 'fortnightly' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customers Scheduled</h3>
                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      Fortnightly Schedule
                    </button>
                  </div>
                  
                  {getCustomersToDisplay().length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700"># / Order</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCustomersToDisplay().map((customer, index) => (
                            <tr key={customer.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                  <span className="text-gray-900 font-medium">{index + 1}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-bold text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">Code: {customer.id.split('_')[1]}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-900">{routeData.visit_time || '09:53'} - {routeData.end_time || '10:23'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900">{routeData.visit_duration || 30} min</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">normal</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button className="text-red-400 hover:text-red-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.306-.835-2.418-2-2.83M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-1.306.835-2.418 2-2.83m0 0a3 3 0 012.83 0M9 15a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p>No customers scheduled yet</p>
                      <p className="text-sm">Add customers in the previous step to see them here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {routeData.name}</div>
                    <div><span className="font-medium">Code:</span> {routeData.code}</div>
                    <div><span className="font-medium">Role:</span> {routeData.role_uid}</div>
                    <div><span className="font-medium">Employee ID:</span> {routeData.job_position_uid}</div>
                    <div><span className="font-medium">Principal:</span> {principals.find(p => p.uid === routeData.principal_uid)?.name || routeData.principal_uid}</div>
                    <div><span className="font-medium">Valid From:</span> {routeData.valid_from}</div>
                    <div><span className="font-medium">Valid Upto:</span> {routeData.valid_upto}</div>
                    <div><span className="font-medium">Assignment Role:</span> {roles.find(r => r.uid === routeData.assignment_role_uid)?.name || routeData.assignment_role_uid}</div>
                    <div><span className="font-medium">Primary Employee:</span> {employees.find(e => e.uid === routeData.primary_employee_uid)?.name || routeData.primary_employee_uid}</div>
                    {routeData.warehouse_uid && (
                      <div><span className="font-medium">Warehouse:</span> {warehouses.find(w => w.uid === routeData.warehouse_uid)?.name || routeData.warehouse_uid}</div>
                    )}
                    {routeData.vehicle_type && (
                      <div><span className="font-medium">Vehicle Type:</span> {routeData.vehicle_type}</div>
                    )}
                  </div>
                </div>
                
                {/* Additional Settings */}
                {(routeData.wh_org_uid || routeData.vehicle_uid || routeData.location_uid || routeData.ss || routeData.total_customers || 
                  routeData.print_standing || routeData.print_topup || routeData.print_order_summary || routeData.auto_freeze_jp || 
                  routeData.add_to_run || routeData.print_forward) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Settings</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {routeData.wh_org_uid && (
                        <div><span className="font-medium">Warehouse Org UID:</span> {routeData.wh_org_uid}</div>
                      )}
                      {routeData.vehicle_uid && (
                        <div><span className="font-medium">Vehicle UID:</span> {routeData.vehicle_uid}</div>
                      )}
                      {routeData.location_uid && (
                        <div><span className="font-medium">Location UID:</span> {routeData.location_uid}</div>
                      )}
                      {routeData.ss && (
                        <div><span className="font-medium">Special Settings:</span> {routeData.ss}</div>
                      )}
                      {routeData.total_customers && routeData.total_customers > 0 && (
                        <div><span className="font-medium">Total Customers:</span> {routeData.total_customers}</div>
                      )}
                      <div className="col-span-2">
                        <span className="font-medium">Print & System Settings:</span>
                        <div className="mt-1 space-y-1">
                          {routeData.print_standing && <div className="text-xs text-green-600">✓ Print Standing</div>}
                          {routeData.print_topup && <div className="text-xs text-green-600">✓ Print Topup</div>}
                          {routeData.print_order_summary && <div className="text-xs text-green-600">✓ Print Order Summary</div>}
                          {routeData.auto_freeze_jp && <div className="text-xs text-green-600">✓ Auto Freeze JP</div>}
                          {routeData.add_to_run && <div className="text-xs text-green-600">✓ Add to Run</div>}
                          {routeData.print_forward && <div className="text-xs text-green-600">✓ Print Forward</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customers ({routeData.customers.length})</h4>
                  {routeData.customers.length > 0 ? (
                    <div className="space-y-2">
                      {routeData.customers.map((customer, index) => (
                        <div key={customer.id} className="text-sm bg-white p-2 rounded border">
                          <div><span className="font-medium">Customer {index + 1}:</span> {customer.name}</div>
                          <div><span className="font-medium">Contact:</span> {customer.contact}</div>
                          <div><span className="font-medium">Visit Time:</span> {customer.visit_time}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No customers added</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Visit Duration:</span> {routeData.visit_duration} minutes</div>
                    <div><span className="font-medium">Travel Time:</span> {routeData.travel_time} minutes</div>
                    <div><span className="font-medium">Start Time:</span> {routeData.visit_time || 'Not set'}</div>
                    <div><span className="font-medium">End Time:</span> {routeData.end_time || 'Not set'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {currentStep === 4 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Route'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
