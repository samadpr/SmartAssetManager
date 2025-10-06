export interface userRegister {
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  address: string
  country: string
  browser: string
  operatingSystem: string
  device: string
  publicIP: string
  password: string
  confirmPassword: string
  latitude: string
  longitude: string
}

export interface registerconfirm {
  email: string,
  otpText: string
}

export interface loginresponse {
  isAuthenticated: boolean
  message: string
  token: string
  email: string;
  fullName: string;
  createdBy: string;
}

export interface userLogin {
  email: string
  password: string
  rememberMe: boolean
  latitude: string
  longitude: string
  publicIp: string
  browser: string
  operatingSystem: string
  device: string
}
