import { ref } from 'vue'

export function usePasswordToggle() {
    const showPassword = ref(false)

    const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value
    }

    const getInputType = () => {
        return showPassword.value ? 'text' : 'password'
    }

    return {
        showPassword,
        togglePasswordVisibility,
        getInputType,
    }
}
