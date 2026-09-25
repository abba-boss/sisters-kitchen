/**
 * Response serializers for data that crosses an HTTP or Socket.IO boundary.
 * Keep these deliberately small: relations are useful for UI context, but
 * credentials, payout details, and reset secrets must never be serialized.
 */

export const publicUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    role: user.role,
  };
};

export const publicVendor = (vendor: any) => {
  if (!vendor) return null;
  const {
    bankName: _bankName,
    accountNumber: _accountNumber,
    accountName: _accountName,
    user,
    ...safe
  } = vendor;
  return { ...safe, user: publicUser(user) };
};

export const publicProduct = (product: any) => {
  if (!product) return null;
  return {
    ...product,
    vendor: publicVendor(product.vendor),
    reviews: (product.reviews || []).map((review: any) => ({
      ...review,
      user: publicUser(review.user),
    })),
  };
};

export const publicPost = (post: any) => {
  if (!post) return null;
  return {
    ...post,
    author: publicUser(post.author),
    vendor: publicVendor(post.vendor),
    product: publicProduct(post.product),
    comments: (post.comments || []).map((comment: any) => ({
      ...comment,
      user: publicUser(comment.user),
    })),
  };
};

export const publicOrder = (order: any) => {
  if (!order) return null;
  return {
    ...order,
    user: publicUser(order.user),
    vendor: publicVendor(order.vendor),
    items: (order.items || []).map((item: any) => ({
      ...item,
      product: publicProduct(item.product),
    })),
    payments: (order.payments || []).map((payment: any) => ({
      ...payment,
      user: publicUser(payment.user),
      order: undefined,
    })),
  };
};

export const publicPayment = (payment: any) => {
  if (!payment) return null;
  return {
    ...payment,
    user: publicUser(payment.user),
    order: publicOrder(payment.order),
  };
};
