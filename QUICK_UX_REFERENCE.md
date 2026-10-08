# Quick UX Components Reference Guide

## 🎯 Quick Imports

```jsx
// Skeleton Loaders
import { 
  ProductCardSkeleton, 
  OrderCardSkeleton, 
  StatsCardSkeleton 
} from '../../components/common/SkeletonLoader';

// Empty States
import { 
  EmptyCart, 
  EmptyOrders, 
  EmptyProducts, 
  EmptySearchResults 
} from '../../components/common/EmptyState';

// Loading Spinners
import { 
  PageLoader, 
  LoadingSpinner, 
  ButtonLoader,
  OverlayLoader 
} from '../../components/common/LoadingSpinner';

// Toast Helpers
import toastHelper from '../../utils/toastConfig';
import { cartToasts, orderToasts, authToasts, vendorToasts } from '../../utils/toastConfig';

// Form Validation
import { useFormValidation, validationRules } from '../../hooks/useFormValidation';
```

---

## 📦 Common Patterns

### Pattern 1: List with Loading & Empty States
```jsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (products.length === 0) {
    return <EmptyProducts onAdd={() => navigate('/add')} />;
  }
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Pattern 2: Form with Validation
```jsx
function LoginForm() {
  const navigate = useNavigate();
  
  const validationSchema = (values) => {
    const errors = {};
    
    const emailError = validationRules.email(values.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validationRules.password(values.password);
    if (passwordError) errors.password = passwordError;
    
    return errors;
  };
  
  const {
    values,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
    isSubmitting,
  } = useFormValidation({ email: '', password: '' }, validationSchema);
  
  const onSubmit = async (values) => {
    try {
      await authService.login(values);
      authToasts.loginSuccess();
      navigate('/dashboard');
    } catch (error) {
      authToasts.loginFailed();
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={getFieldError('email') ? 'border-red-400' : ''}
        />
        {getFieldError('email') && (
          <span className="text-red-500 text-xs">{getFieldError('email')}</span>
        )}
      </div>
      
      <div>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          className={getFieldError('password') ? 'border-red-400' : ''}
        />
        {getFieldError('password') && (
          <span className="text-red-500 text-xs">{getFieldError('password')}</span>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? <ButtonLoader /> : 'Login'}
      </button>
    </form>
  );
}
```

### Pattern 3: Page with Full Loading
```jsx
function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    orderService.getById(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toastHelper.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);
  
  if (loading) {
    return <PageLoader message="Loading order details..." />;
  }
  
  if (!order) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }
  
  return (
    <div>
      {/* Order details */}
    </div>
  );
}
```

### Pattern 4: Button with Loading State
```jsx
function SubmitButton() {
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveData();
      toastHelper.success('Changes saved!');
    } catch {
      toastHelper.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <button 
      onClick={handleSave} 
      disabled={saving}
      className="btn-primary"
    >
      {saving ? <ButtonLoader /> : 'Save Changes'}
    </button>
  );
}
```

### Pattern 5: Search with Empty Results
```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const data = await searchService.search(searchQuery);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (results.length === 0 && query) {
    return (
      <EmptySearchResults 
        query={query}
        onClear={() => { setQuery(''); setResults([]); }}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {results.map(item => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
```

---

## 🎨 Toast Notification Quick Reference

```jsx
// Success
toastHelper.success('Custom success message');
cartToasts.added(productName);
orderToasts.placed();
authToasts.loginSuccess();
vendorToasts.productAdded();

// Error
toastHelper.error('Custom error message');
toastHelper.error(toastHelper.errorMessages.network);
toastHelper.error(toastHelper.errorMessages.unauthorized);

// Info
toastHelper.info('Information message');

// Warning
toastHelper.warning('Warning message');

// Loading
const loadingToast = toastHelper.loading('Processing...');
// Later: toast.dismiss(loadingToast);

// Promise (auto-handles loading/success/error)
toastHelper.promise(
  apiCall(),
  {
    loading: 'Saving...',
    success: 'Saved successfully!',
    error: 'Failed to save',
  }
);

// With Action Button
toastHelper.withAction(
  'Item added to cart',
  'View Cart',
  () => navigate('/cart')
);
```

---

## 🎯 Component Props Quick Reference

### ProductCardSkeleton
```jsx
<ProductCardSkeleton />
// No props needed
```

### EmptyState
```jsx
<EmptyState
  icon="cart"              // or any Lucide icon name
  title="Your cart is empty"
  description="Add items to get started"
  action={() => navigate('/products')}
  actionLabel="Browse Products"
  secondaryAction={() => {}}  // optional
  secondaryActionLabel="Learn More"  // optional
/>
```

### LoadingSpinner
```jsx
<LoadingSpinner 
  size="md"        // sm, md, lg, xl
  className=""     // optional additional classes
/>
```

### PageLoader
```jsx
<PageLoader message="Loading..." />
```

### useFormValidation Hook
```jsx
const {
  values,          // Current form values
  errors,          // Validation errors
  touched,         // Fields that have been touched
  isSubmitting,    // Form submission state
  isValid,         // Is form valid?
  handleChange,    // Input change handler
  handleBlur,      // Input blur handler
  handleSubmit,    // Form submit handler
  resetForm,       // Reset form to initial values
  setFieldValue,   // Set field value programmatically
  setFieldError,   // Set field error programmatically
  getFieldError,   // Get field error if touched
  validateForm,    // Validate entire form
} = useFormValidation(initialValues, validationSchema);
```

---

## ⚡ Performance Tips

1. **Use skeleton loaders for perceived performance**
   - Show layout immediately even while loading data
   - Match skeleton structure to actual content

2. **Limit skeleton count**
   - Show 6-8 skeletons max, not 50
   - Use pagination if needed

3. **Toast duration matters**
   - Success: 3s
   - Error: 5s (more time to read)
   - Info: 4s
   - Loading: Until dismissed

4. **Validate on blur, not on change**
   - Less annoying for users
   - Better performance

5. **Debounce search input**
   - Use `useDebounce` hook
   - 300ms delay is good

---

## ❌ Common Mistakes to Avoid

### ❌ DON'T:
```jsx
// Don't use old skeleton pattern
{loading && <div className="skeleton h-24" />}

// Don't show blank empty states
{items.length === 0 && <p>No items</p>}

// Don't use technical error messages
toast.error('Error: 500 Internal Server Error');

// Don't validate on every keystroke
onChange={(e) => validateField(e.target.name)}
```

### ✅ DO:
```jsx
// Use skeleton components
{loading && <OrderCardSkeleton />}

// Use helpful empty states
{items.length === 0 && <EmptyOrders onBrowse={() => navigate('/products')} />}

// Use friendly error messages
toastHelper.error(toastHelper.errorMessages.network);

// Validate on blur
onBlur={(e) => handleBlur(e)}
```

---

## 🔍 Debugging Tips

### Component not showing?
```jsx
// Check import path
import { EmptyCart } from '../../components/common/EmptyState';
// Not from '../EmptyState' or './EmptyState'

// Check component name
<EmptyCart />  // Correct
<EmptyCartState />  // Wrong
```

### Toast not appearing?
```jsx
// Make sure Toaster is in App.jsx
import { Toaster } from 'react-hot-toast';

<Toaster position="top-center" />
```

### Validation not working?
```jsx
// Make sure you're using handleBlur
<input
  name="email"
  onChange={handleChange}
  onBlur={handleBlur}  // Important!
/>

// Check getFieldError usage
{getFieldError('email') && (  // Not errors.email
  <span>{getFieldError('email')}</span>
)}
```

---

## 📱 Mobile Considerations

1. **Touch targets**: Minimum 44x44px
2. **Skeleton sizing**: Same as mobile card size
3. **Toast positioning**: `top-center` works best
4. **Empty state icons**: Max 80px on mobile
5. **Loading spinners**: Use smaller sizes on mobile

---

## 🎯 When to Use What

| Scenario | Component |
|----------|-----------|
| List loading | `ProductCardSkeleton` or `OrderCardSkeleton` |
| Page loading | `PageLoader` |
| Button loading | `ButtonLoader` |
| Form submitting | `OverlayLoader` or `ButtonLoader` |
| Empty list | Specific empty state component |
| No search results | `EmptySearchResults` |
| API error | `ErrorState` |
| Success action | `toastHelper.success()` |
| Form validation | `useFormValidation` hook |

---

## 🚀 Quick Start Checklist

When adding a new page:
- [ ] Add loading state with appropriate skeleton
- [ ] Add empty state with helpful message + action
- [ ] Use toast notifications for feedback
- [ ] Validate forms on blur, not on change
- [ ] Handle errors gracefully
- [ ] Test on mobile

---

**That's it! You're ready to use the new UX components.** 🎉

For more details, see:
- `READY_FOR_TESTING_UX_IMPROVEMENTS.md` - Full testing guide
- `UX_IMPLEMENTATION_SESSION_SUMMARY.md` - Implementation details
- Component source files in `frontend/src/components/common/`

