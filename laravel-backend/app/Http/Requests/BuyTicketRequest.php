<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuyTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20', 'regex:/^\+?[78](\D*\d){10}$/'],
            'ticket_type' => 'required|in:standard,vip,premium,cosplay,tournament',
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\p{L}\p{M}\s\-\']+$/u'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Укажите email.',
            'email.email' => 'Введите корректный email (например: name@example.com).',
            'email.max' => 'Email не должен превышать 255 символов.',
            'phone.required' => 'Укажите номер телефона.',
            'phone.regex' => 'Введите корректный номер телефона: +7 (XXX) XXX-XX-XX или 8 XXX XXX-XX-XX.',
            'name.required' => 'Укажите имя.',
            'name.min' => 'Имя должно быть не короче 2 символов.',
            'name.max' => 'Имя не должно превышать 255 символов.',
            'name.regex' => 'Имя может содержать только буквы, пробелы и дефис.',
            'last_name.regex' => 'Фамилия может содержать только буквы, пробелы и дефис.',
        ];
    }
}
